import { PrismaClient, Land } from '@prisma/client';
import crypto from 'crypto';
import { AppError } from '../middleware/errorHandler.middleware.js';
import { CreateLandInput, SearchLandInput } from '../validators/land.validator.js';
import { AuditService } from './AuditService.js';
import { NotificationService } from './NotificationService.js';

const prisma = new PrismaClient();

export class LandService {
  /**
   * Generates a standardized property identifier e.g. PROP-KA-BLR-2024-XXXX
   */
  static generatePropertyId(district: string, state: string): string {
    const statePrefix = state.slice(0, 2).toUpperCase();
    const distPrefix = district.replace(/\s+/g, '').slice(0, 3).toUpperCase();
    const year = new Date().getFullYear();
    const rand = crypto.randomBytes(3).toString('hex').toUpperCase();
    return `PROP-${statePrefix}-${distPrefix}-${year}-${rand}`;
  }

  /**
   * Submits a new land parcel for government registration
   */
  static async createLand(
    data: CreateLandInput,
    ownerId: string,
    ip?: string
  ): Promise<Land> {
    const owner = await prisma.user.findUnique({
      where: { id: ownerId },
    });

    if (!owner) {
      throw new AppError('Owner account not found', 404);
    }

    if (!owner.walletAddress) {
      throw new AppError(
        'Please link your MetaMask Ethereum wallet before submitting a land registration',
        400
      );
    }

    if (!owner.isAadhaarVerified) {
      throw new AppError(
        'Please complete DigiLocker Aadhaar e-KYC verification before submitting a land registration',
        400
      );
    }

    // Check duplicate survey number in same village & district
    const existing = await prisma.land.findFirst({
      where: {
        surveyNumber: data.surveyNumber,
        district: data.district,
        village: data.village,
      },
    });

    if (existing) {
      throw new AppError(
        `A land parcel with survey number ${data.surveyNumber} in village ${data.village} is already registered or under review`,
        400
      );
    }

    const propertyId = this.generatePropertyId(data.district, data.state);

    const land = await prisma.$transaction(async (tx) => {
      const createdLand = await tx.land.create({
        data: {
          propertyId,
          surveyNumber: data.surveyNumber,
          ownerId,
          area: data.area,
          landType: data.landType,
          village: data.village,
          taluk: data.taluk,
          district: data.district,
          state: data.state,
          latitude: data.latitude,
          longitude: data.longitude,
          description: data.description || null,
          status: 'PENDING_VERIFICATION',
        },
      });

      await tx.registrationApplication.create({
        data: {
          applicantId: ownerId,
          landId: createdLand.id,
          status: 'PENDING_VERIFICATION',
          remarks: 'Initial application submitted by owner. Awaiting document verification.',
        },
      });

      return createdLand;
    });

    await AuditService.log({
      userId: ownerId,
      action: 'LAND_CREATED',
      entityType: 'LAND',
      entityId: land.id,
      ipAddress: ip,
      metadata: { propertyId: land.propertyId, surveyNumber: land.surveyNumber },
    });

    await NotificationService.send({
      userId: ownerId,
      title: 'Land Application Submitted',
      message: `Your land registration application for Property ID ${land.propertyId} (Survey #${land.surveyNumber}) was submitted successfully.`,
      type: 'INFO',
    });

    return land;
  }

  /**
   * Retrieves lands with multi-parameter filtering and pagination
   */
  static async getLands(params: SearchLandInput) {
    const page = params.page || 1;
    const limit = params.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (params.status) {
      where.status = params.status;
    }

    if (params.district) {
      where.district = { contains: params.district };
    }

    if (params.landType) {
      where.landType = params.landType;
    }

    if (params.propertyId) {
      where.propertyId = { contains: params.propertyId };
    }

    if (params.surveyNumber) {
      where.surveyNumber = { contains: params.surveyNumber };
    }

    if (params.query) {
      where.OR = [
        { propertyId: { contains: params.query } },
        { surveyNumber: { contains: params.query } },
        { village: { contains: params.query } },
        { district: { contains: params.query } },
        { description: { contains: params.query } },
      ];
    }

    const [lands, total] = await Promise.all([
      prisma.land.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          owner: {
            select: { id: true, name: true, email: true, walletAddress: true, isAadhaarVerified: true, aadhaarMasked: true },
          },
          documents: true,
          _count: {
            select: { documents: true, ownershipHistories: true },
          },
        },
      }),
      prisma.land.count({ where }),
    ]);

    return {
      lands,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Retrieves all properties owned by a specific user
   */
  static async getMyLands(userId: string) {
    return await prisma.land.findMany({
      where: { ownerId: userId },
      orderBy: { createdAt: 'desc' },
      include: {
        documents: true,
        registrationApplications: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        transferRequests: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });
  }

  /**
   * Retrieves a single land parcel with full relational context
   */
  static async getLandById(id: string) {
    const land = await prisma.land.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            walletAddress: true,
            phone: true,
            isAadhaarVerified: true,
            aadhaarMasked: true,
            digilockerUri: true,
            aadhaarVerifiedAt: true,
          },
        },
        documents: {
          include: {
            uploadedBy: {
              select: { id: true, name: true, role: true },
            },
          },
        },
        registrationApplications: {
          include: {
            applicant: { select: { id: true, name: true, email: true } },
            reviewedBy: { select: { id: true, name: true, email: true } },
          },
        },
        ownershipHistories: {
          include: {
            previousOwner: { select: { id: true, name: true, walletAddress: true } },
            newOwner: { select: { id: true, name: true, walletAddress: true } },
          },
          orderBy: { transferredAt: 'desc' },
        },
        blockchainTransactions: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!land) {
      throw new AppError('Land record not found', 404);
    }

    return land;
  }

  /**
   * Retrieves public information for a property (privacy-preserving)
   */
  static async getPublicLand(propertyId: string) {
    const land = await prisma.land.findUnique({
      where: { propertyId },
      include: {
        owner: {
          select: {
            walletAddress: true,
            isAadhaarVerified: true,
            aadhaarMasked: true,
          }, // Redact personal PII, preserve verified Aadhaar proof
        },
        documents: {
          select: {
            id: true,
            documentType: true,
            fileHash: true,
            verificationStatus: true,
            createdAt: true,
          },
        },
        ownershipHistories: {
          select: {
            previousOwner: { select: { walletAddress: true } },
            newOwner: { select: { walletAddress: true } },
            transferredAt: true,
            blockchainTxHash: true,
          },
          orderBy: { transferredAt: 'desc' },
        },
        blockchainTransactions: {
          select: {
            transactionHash: true,
            blockNumber: true,
            transactionType: true,
            status: true,
            gasUsed: true,
            createdAt: true,
          },
        },
      },
    });

    if (!land) {
      throw new AppError(`No public record found for Property ID: ${propertyId}`, 404);
    }

    return land;
  }
}
