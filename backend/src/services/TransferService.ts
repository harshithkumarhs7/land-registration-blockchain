import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/errorHandler.middleware.js';
import { landRegistryService } from '../blockchain/LandRegistryService.js';
import { AuditService } from './AuditService.js';
import { NotificationService } from './NotificationService.js';
import { logger } from '../utils/logger.js';

const prisma = new PrismaClient();

export class TransferService {
  /**
   * Initiates a multi-step ownership transfer request
   */
  static async createTransferRequest(
    landId: string,
    sellerId: string,
    buyerId: string,
    reason: string,
    ip?: string
  ) {
    const land = await prisma.land.findUnique({
      where: { id: landId },
      include: { owner: true },
    });

    if (!land) {
      throw new AppError('Land parcel not found', 404);
    }

    if (land.ownerId !== sellerId) {
      throw new AppError('Only the legal recorded owner can initiate an ownership transfer', 403);
    }

    if (land.status !== 'REGISTERED') {
      throw new AppError('Only fully registered properties on blockchain can be transferred', 400);
    }

    if (sellerId === buyerId) {
      throw new AppError('New owner must be different from current owner', 400);
    }

    const buyer = await prisma.user.findUnique({
      where: { id: buyerId },
    });

    if (!buyer) {
      throw new AppError('Target buyer account not found', 404);
    }

    if (!buyer.walletAddress) {
      throw new AppError('Buyer must have a linked Ethereum wallet to receive on-chain land title', 400);
    }

    // Check for existing pending transfer
    const existingTransfer = await prisma.transferRequest.findFirst({
      where: {
        landId,
        status: { in: ['PENDING', 'UNDER_REVIEW', 'APPROVED', 'BLOCKCHAIN_PENDING'] },
      },
    });

    if (existingTransfer) {
      throw new AppError('An active ownership transfer request already exists for this land', 400);
    }

    const transfer = await prisma.$transaction(async (tx) => {
      const req = await tx.transferRequest.create({
        data: {
          landId,
          sellerId,
          buyerId,
          status: 'PENDING',
          reason,
        },
      });

      await tx.land.update({
        where: { id: landId },
        data: { status: 'TRANSFER_PENDING' },
      });

      return req;
    });

    await AuditService.log({
      userId: sellerId,
      action: 'TRANSFER_CREATED',
      entityType: 'TRANSFER',
      entityId: transfer.id,
      ipAddress: ip,
      metadata: { landId, propertyId: land.propertyId, buyerId },
    });

    await NotificationService.send({
      userId: buyerId,
      title: 'Land Purchase / Transfer Request Received',
      message: `You have received an ownership transfer request for Property ${land.propertyId} from ${land.owner.name}.`,
      type: 'INFO',
    });

    await NotificationService.send({
      userId: sellerId,
      title: 'Ownership Transfer Request Initiated',
      message: `Transfer request for ${land.propertyId} was submitted and is pending government registrar approval.`,
      type: 'INFO',
    });

    return transfer;
  }

  /**
   * Retrieves transfer requests based on user context
   */
  static async getTransferRequests(params: {
    userId?: string;
    role?: string;
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

    if (params.role === 'LAND_OWNER' && params.userId) {
      where.OR = [{ sellerId: params.userId }, { buyerId: params.userId }];
    } else if (params.role === 'BUYER' && params.userId) {
      where.buyerId = params.userId;
    }

    const [transfers, total] = await Promise.all([
      prisma.transferRequest.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          land: true,
          seller: {
            select: { id: true, name: true, email: true, walletAddress: true },
          },
          buyer: {
            select: { id: true, name: true, email: true, walletAddress: true },
          },
          reviewedBy: {
            select: { id: true, name: true, email: true },
          },
        },
      }),
      prisma.transferRequest.count({ where }),
    ]);

    return {
      transfers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Approves transfer and executes on-chain transferOwnership
   */
  static async approveTransfer(
    transferRequestId: string,
    registrarId: string,
    ip?: string
  ) {
    const transfer = await prisma.transferRequest.findUnique({
      where: { id: transferRequestId },
      include: {
        land: true,
        seller: true,
        buyer: true,
      },
    });

    if (!transfer) {
      throw new AppError('Transfer request not found', 404);
    }

    if (transfer.status === 'COMPLETED') {
      throw new AppError('Transfer request is already completed', 400);
    }

    if (!transfer.buyer.walletAddress) {
      throw new AppError('Buyer does not have an active Ethereum wallet', 400);
    }

    // Set status to BLOCKCHAIN_PENDING
    await prisma.transferRequest.update({
      where: { id: transferRequestId },
      data: { status: 'BLOCKCHAIN_PENDING' },
    });

    try {
      // 1. Submit on-chain transfer transaction
      const receipt = await landRegistryService.transferOwnershipOnChain(
        transfer.land.propertyId,
        transfer.buyer.walletAddress,
        `TX-TRANSFER-${transfer.id.slice(0, 8)}`
      );

      // 2. Commit updates atomically in database
      await prisma.$transaction(async (tx) => {
        // Update Land current owner
        await tx.land.update({
          where: { id: transfer.landId },
          data: {
            ownerId: transfer.buyerId,
            status: 'REGISTERED',
            blockchainTxHash: receipt.transactionHash,
            blockchainBlockNumber: receipt.blockNumber,
          },
        });

        // Record historical provenance
        await tx.ownershipHistory.create({
          data: {
            landId: transfer.landId,
            previousOwnerId: transfer.sellerId,
            newOwnerId: transfer.buyerId,
            transferRequestId: transfer.id,
            blockchainTxHash: receipt.transactionHash,
          },
        });

        // Update TransferRequest to COMPLETED
        await tx.transferRequest.update({
          where: { id: transferRequestId },
          data: {
            status: 'COMPLETED',
            reviewedById: registrarId,
            reviewedAt: new Date(),
            blockchainTxHash: receipt.transactionHash,
          },
        });

        // Record confirmed blockchain transaction
        await tx.blockchainTransaction.create({
          data: {
            landId: transfer.landId,
            transactionHash: receipt.transactionHash,
            blockNumber: receipt.blockNumber,
            transactionType: 'OWNERSHIP_TRANSFER',
            fromAddress: receipt.from,
            toAddress: receipt.to,
            status: 'CONFIRMED',
            gasUsed: receipt.gasUsed,
          },
        });
      });

      // 3. Audit log & Notifications
      await AuditService.log({
        userId: registrarId,
        action: 'OWNERSHIP_TRANSFERRED',
        entityType: 'TRANSFER',
        entityId: transfer.id,
        ipAddress: ip,
        metadata: {
          propertyId: transfer.land.propertyId,
          previousOwner: transfer.seller.walletAddress,
          newOwner: transfer.buyer.walletAddress,
          txHash: receipt.transactionHash,
        },
      });

      await NotificationService.send({
        userId: transfer.buyerId,
        title: 'Ownership Transfer Complete',
        message: `Congratulations! Property ${transfer.land.propertyId} has been successfully transferred to your ownership on the blockchain.`,
        type: 'SUCCESS',
      });

      await NotificationService.send({
        userId: transfer.sellerId,
        title: 'Property Transfer Executed',
        message: `Ownership of Property ${transfer.land.propertyId} has been legally transferred to ${transfer.buyer.name}.`,
        type: 'INFO',
      });

      return {
        success: true,
        message: 'Ownership transfer executed and confirmed on blockchain',
        transactionHash: receipt.transactionHash,
        blockNumber: receipt.blockNumber,
      };
    } catch (err: any) {
      logger.error(`Blockchain transfer failed: ${err.message}`);

      // Revert status to UNDER_REVIEW so it can be retried
      await prisma.transferRequest.update({
        where: { id: transferRequestId },
        data: { status: 'UNDER_REVIEW' },
      });

      await AuditService.log({
        userId: registrarId,
        action: 'TRANSFER_BLOCKCHAIN_FAILED',
        entityType: 'TRANSFER',
        entityId: transfer.id,
        ipAddress: ip,
        metadata: { error: err.message },
      });

      throw new AppError(`Blockchain transfer failed: ${err.message}`, 500);
    }
  }

  /**
   * Rejects an ownership transfer request
   */
  static async rejectTransfer(
    transferRequestId: string,
    registrarId: string,
    reason: string,
    ip?: string
  ) {
    const transfer = await prisma.transferRequest.findUnique({
      where: { id: transferRequestId },
      include: { land: true },
    });

    if (!transfer) {
      throw new AppError('Transfer request not found', 404);
    }

    await prisma.$transaction([
      prisma.transferRequest.update({
        where: { id: transferRequestId },
        data: {
          status: 'REJECTED',
          reason,
          reviewedById: registrarId,
          reviewedAt: new Date(),
        },
      }),
      prisma.land.update({
        where: { id: transfer.landId },
        data: { status: 'REGISTERED' },
      }),
    ]);

    await AuditService.log({
      userId: registrarId,
      action: 'TRANSFER_REJECTED',
      entityType: 'TRANSFER',
      entityId: transfer.id,
      ipAddress: ip,
      metadata: { reason },
    });

    await NotificationService.send({
      userId: transfer.sellerId,
      title: 'Transfer Request Rejected',
      message: `The transfer request for ${transfer.land.propertyId} was rejected. Reason: ${reason}`,
      type: 'WARNING',
    });

    await NotificationService.send({
      userId: transfer.buyerId,
      title: 'Transfer Request Rejected',
      message: `The transfer request for ${transfer.land.propertyId} was rejected by registrar. Reason: ${reason}`,
      type: 'WARNING',
    });

    return { success: true, message: 'Transfer request rejected' };
  }
}
