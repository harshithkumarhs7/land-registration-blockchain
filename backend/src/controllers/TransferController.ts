import { Request, Response, NextFunction } from 'express';
import { TransferService } from '../services/TransferService.js';

export class TransferController {
  static async getEligibleBuyers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const buyers = await TransferService.getEligibleBuyers(req.user!.id);
      res.status(200).json({
        success: true,
        data: { buyers },
      });
    } catch (error) {
      next(error);
    }
  }

  static async createTransfer(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { landId, buyerId, reason } = req.body;
      const transfer = await TransferService.createTransferRequest(
        landId,
        req.user!.id,
        buyerId,
        reason,
        req.ip
      );
      res.status(201).json({
        success: true,
        message: 'Ownership transfer request initiated successfully',
        data: { transfer },
      });
    } catch (error) {
      next(error);
    }
  }

  static async getTransfers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await TransferService.getTransferRequests({
        userId: req.user!.id,
        role: req.user!.role,
        status: req.query.status as string,
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

  static async approveTransfer(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await TransferService.approveTransfer(
        req.params.id,
        req.user!.id,
        req.ip
      );
      res.status(200).json({
        success: true,
        message: result.message,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async rejectTransfer(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { reason } = req.body;
      const result = await TransferService.rejectTransfer(
        req.params.id,
        req.user!.id,
        reason || 'Transfer rejected by registrar',
        req.ip
      );
      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }
}
