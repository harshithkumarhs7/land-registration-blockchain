import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { landRegistryService } from '../blockchain/LandRegistryService.js';
import { config } from '../config/index.js';

const prisma = new PrismaClient();

export class BlockchainController {
  static async getTransactions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      const skip = (page - 1) * limit;

      const [transactions, total] = await Promise.all([
        prisma.blockchainTransaction.findMany({
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
          include: {
            land: {
              select: { propertyId: true, surveyNumber: true, district: true },
            },
          },
        }),
        prisma.blockchainTransaction.count(),
      ]);

      res.status(200).json({
        success: true,
        data: {
          transactions,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async getTransactionByHash(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { hash } = req.params;
      const dbTx = await prisma.blockchainTransaction.findUnique({
        where: { transactionHash: hash },
        include: { land: true },
      });

      let onChainReceipt = null;
      try {
        onChainReceipt = await landRegistryService.getTransactionReceipt(hash);
      } catch (err) {
        // Local or offline node fallback
      }

      res.status(200).json({
        success: true,
        data: {
          transaction: dbTx,
          onChainReceipt,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async getLandFromChain(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { propertyId } = req.params;
      const onChainRecord = await landRegistryService.getLandFromChain(propertyId);
      const onChainHistory = await landRegistryService.getOwnershipHistoryFromChain(propertyId);

      res.status(200).json({
        success: true,
        data: {
          propertyId,
          onChainRecord,
          onChainHistory,
          contractAddress: config.blockchain.contractAddress,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async verifyDocumentOnChain(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { propertyId } = req.params;
      const { documentHash } = req.body;

      const result = await landRegistryService.verifyDocumentOnChain(propertyId, documentHash);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const isAvailable = await landRegistryService.isAvailable();
      res.status(200).json({
        success: true,
        data: {
          network: 'Hardhat Local Node (EVM)',
          chainId: 31337,
          rpcUrl: config.blockchain.rpcUrl,
          contractAddress: config.blockchain.contractAddress,
          isAvailable,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}
