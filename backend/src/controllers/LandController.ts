import { Request, Response, NextFunction } from 'express';
import { LandService } from '../services/LandService.js';

export class LandController {
  static async createLand(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const land = await LandService.createLand(req.body, req.user!.id, req.ip);
      res.status(201).json({
        success: true,
        message: 'Land registration submitted successfully',
        data: { land },
      });
    } catch (error) {
      next(error);
    }
  }

  static async getLands(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await LandService.getLands(req.query as any);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getMyLands(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const lands = await LandService.getMyLands(req.user!.id);
      res.status(200).json({
        success: true,
        data: { lands },
      });
    } catch (error) {
      next(error);
    }
  }

  static async getLandById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const land = await LandService.getLandById(req.params.id);
      res.status(200).json({
        success: true,
        data: { land },
      });
    } catch (error) {
      next(error);
    }
  }
}
