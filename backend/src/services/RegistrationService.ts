import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/errorHandler.middleware.js';
import { landRegistryService } from '../blockchain/LandRegistryService.js';
import { AuditService } from './AuditService.js';
import { NotificationService } from './NotificationService.js';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

const prisma = new PrismaClient();

export class RegistrationService {
  /**
   * Lists registration applications for government registrars
   */
  static async getApplications(params: {
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const page = params.page || 1;
    const limit = params.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (params.status) {
      where.status = params.status;
    }

    const [applications, total] = await Promise.all([
      prisma.registrationApplication.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          applicant: {
            select: { id: true, name: true, email: true, walletAddress: true, phone: true },
          },
          land: {
            include: {
              documents: true,
            },
          },
          reviewedBy: {
            select: { id: true, name: true, email: true },
          },
        },
      }),
      prisma.registrationApplication.count({ where }),
    ]);

    return {
      applications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Retrieves single application with full documents and applicant context
   */
  static async getApplicationById(id: string) {
    const application = await prisma.registrationApplication.findUnique({
      where: { id },
      include: {
        applicant: {
          select: { id: true, name: true, email: true, walletAddress: true, phone: true },
        },
        land: {
          include: {
            documents: true,
            blockchainTransactions: true,
          },
        },
        reviewedBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!application) {
      throw new AppError('Registration application not found', 404);
    }

    return application;
  }

  /**
   * Approves land application and commits the registration onto the blockchain
   */
  static async approveApplication(
    applicationId: string,
    registrarId: string,
    remarks?: string,
    ip?: string
  ) {
    const application = await prisma.registrationApplication.findUnique({
      where: { id: applicationId },
      include: {
        applicant: true,
        land: {
          include: { documents: true },
        },
      },
    });

    if (!application) {
      throw new AppError('Application not found', 404);
    }

    if (application.status === 'APPROVED') {
      throw new AppError('Application is already approved and registered', 400);
    }

    if (!application.applicant.walletAddress) {
      throw new AppError('Applicant does not have a linked Ethereum wallet address', 400);
    }

    if (application.land.documents.length === 0) {
      throw new AppError('Cannot approve land registration without supporting title documents', 400);
    }

    // Identify primary document hash (e.g. SALE_DEED or first document)
    const primaryDoc =
      application.land.documents.find((d) => d.documentType === 'SALE_DEED') ||
      application.land.documents[0];

    // Transition state to BLOCKCHAIN_PENDING
    await prisma.land.update({
      where: { id: application.landId },
      data: { status: 'BLOCKCHAIN_PENDING' },
    });

    try {
      // 1. Submit on-chain registration transaction
      const receipt = await landRegistryService.registerLandOnChain(
        application.land.propertyId,
        application.land.surveyNumber,
        application.applicant.walletAddress,
        primaryDoc.fileHash
      );

      // 2. Atomically update database records
      await prisma.$transaction(async (tx) => {
        // Update Land status to REGISTERED
        await tx.land.update({
          where: { id: application.landId },
          data: {
            status: 'REGISTERED',
            blockchainPropertyId: application.land.propertyId,
            blockchainTxHash: receipt.transactionHash,
            blockchainBlockNumber: receipt.blockNumber,
            contractAddress: config.blockchain.contractAddress,
          },
        });

        // Update application
        await tx.registrationApplication.update({
          where: { id: applicationId },
          data: {
            status: 'APPROVED',
            remarks: remarks || 'Application verified and registered on blockchain.',
            reviewedById: registrarId,
            reviewedAt: new Date(),
          },
        });

        // Record confirmed blockchain transaction
        await tx.blockchainTransaction.create({
          data: {
            landId: application.landId,
            transactionHash: receipt.transactionHash,
            blockNumber: receipt.blockNumber,
            transactionType: 'LAND_REGISTRATION',
            fromAddress: receipt.from,
            toAddress: receipt.to,
            status: 'CONFIRMED',
            gasUsed: receipt.gasUsed,
          },
        });

        // Mark verified documents as VERIFIED
        await tx.landDocument.updateMany({
          where: { landId: application.landId },
          data: { verificationStatus: 'VERIFIED' },
        });
      });

      // 3. Audit log & user notifications
      await AuditService.log({
        userId: registrarId,
        action: 'LAND_REGISTERED_BLOCKCHAIN',
        entityType: 'BLOCKCHAIN',
        entityId: application.landId,
        ipAddress: ip,
        metadata: {
          propertyId: application.land.propertyId,
          txHash: receipt.transactionHash,
          blockNumber: receipt.blockNumber,
        },
      });

      await NotificationService.send({
        userId: application.applicantId,
        title: 'Land Registration Approved & Confirmed on Blockchain',
        message: `Property ${application.land.propertyId} is now officially registered on Ethereum blockchain (Tx: ${receipt.transactionHash.slice(0, 10)}...).`,
        type: 'SUCCESS',
      });

      return {
        success: true,
        message: 'Land registered successfully on blockchain',
        transactionHash: receipt.transactionHash,
        blockNumber: receipt.blockNumber,
      };
    } catch (chainError: any) {
      logger.error(`Blockchain transaction failed: ${chainError.message}`);

      // Reconcile database state: mark as BLOCKCHAIN_FAILED
      await prisma.land.update({
        where: { id: application.landId },
        data: { status: 'BLOCKCHAIN_FAILED' },
      });

      await AuditService.log({
        userId: registrarId,
        action: 'BLOCKCHAIN_REGISTRATION_FAILED',
        entityType: 'BLOCKCHAIN',
        entityId: application.landId,
        ipAddress: ip,
        metadata: { error: chainError.message },
      });

      throw new AppError(
        `Blockchain operation failed: ${chainError.message}. Land status set to BLOCKCHAIN_FAILED for retry.`,
        500
      );
    }
  }

  /**
   * Rejects an application with official government remarks
   */
  static async rejectApplication(
    applicationId: string,
    registrarId: string,
    remarks: string,
    ip?: string
  ) {
    const application = await prisma.registrationApplication.findUnique({
      where: { id: applicationId },
      include: { land: true },
    });

    if (!application) {
      throw new AppError('Application not found', 404);
    }

    await prisma.$transaction([
      prisma.registrationApplication.update({
        where: { id: applicationId },
        data: {
          status: 'REJECTED',
          remarks,
          reviewedById: registrarId,
          reviewedAt: new Date(),
        },
      }),
      prisma.land.update({
        where: { id: application.landId },
        data: { status: 'REJECTED' },
      }),
    ]);

    await AuditService.log({
      userId: registrarId,
      action: 'REGISTRATION_REJECTED',
      entityType: 'LAND',
      entityId: application.landId,
      ipAddress: ip,
      metadata: { remarks },
    });

    await NotificationService.send({
      userId: application.applicantId,
      title: 'Land Registration Application Rejected',
      message: `Your application for Property ${application.land.propertyId} was rejected. Remarks: ${remarks}`,
      type: 'ERROR',
    });

    return { success: true, message: 'Application rejected' };
  }
}
