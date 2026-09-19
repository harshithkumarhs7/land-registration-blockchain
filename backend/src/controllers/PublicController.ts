import { Request, Response, NextFunction } from 'express';
import { LandService } from '../services/LandService.js';
import { landRegistryService } from '../blockchain/LandRegistryService.js';
import { config } from '../config/index.js';

export class PublicController {
  static async searchLands(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await LandService.getLands({
        query: req.query.query as string,
        propertyId: req.query.propertyId as string,
        surveyNumber: req.query.surveyNumber as string,
        district: req.query.district as string,
        landType: req.query.landType as string,
        status: req.query.status as string || 'REGISTERED', // By default show verified registered properties
        page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 10,
      });

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async verifyProperty(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { propertyId } = req.params;
      const dbRecord = await LandService.getPublicLand(propertyId);

      let blockchainRecord = null;
      let onChainHistory: any[] = [];
      let isChainVerified = false;

      try {
        blockchainRecord = await landRegistryService.getLandFromChain(propertyId);
        onChainHistory = await landRegistryService.getOwnershipHistoryFromChain(propertyId);
        isChainVerified = blockchainRecord !== null && blockchainRecord.exists;
      } catch (err) {
        // Local blockchain fallback
      }

      res.status(200).json({
        success: true,
        data: {
          propertyId,
          databaseRecord: dbRecord,
          blockchainRecord,
          onChainHistory,
          isChainVerified,
          contractAddress: config.blockchain.contractAddress,
          verifiedAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      next(error);
    }
  }
}
