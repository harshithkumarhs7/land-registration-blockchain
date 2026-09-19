import { Request, Response, NextFunction } from 'express';
import { RegistrationService } from '../services/RegistrationService.js';

export class RegistrationController {
  static async getApplications(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await RegistrationService.getApplications(req.query as any);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getApplicationById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const application = await RegistrationService.getApplicationById(req.params.id);
      res.status(200).json({
        success: true,
        data: { application },
      });
    } catch (error) {
      next(error);
    }
  }

  static async approveApplication(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { remarks } = req.body;
      const result = await RegistrationService.approveApplication(
        req.params.id,
        req.user!.id,
        remarks,
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

  static async rejectApplication(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { remarks } = req.body;
      const result = await RegistrationService.rejectApplication(
        req.params.id,
        req.user!.id,
        remarks,
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
