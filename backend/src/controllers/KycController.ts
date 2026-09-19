import { Request, Response, NextFunction } from 'express';
import { DigiLockerService } from '../services/DigiLockerService.js';
import {
  requestAadhaarOtpSchema,
  verifyAadhaarOtpSchema,
  digilockerCallbackSchema,
} from '../validators/kyc.validator.js';

export class KycController {
  /**
   * Retrieves KYC verification status for current user
   */
  static async getStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const status = await DigiLockerService.getKycStatus(req.user!.id);
      res.status(200).json({
        success: true,
        data: status,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Dispatches an Aadhaar OTP verification request
   */
  static async requestOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = requestAadhaarOtpSchema.parse(req.body);
      const result = await DigiLockerService.requestAadhaarOtp(
        req.user!.id,
        validated.aadhaarNumber,
        req.ip
      );

      res.status(200).json({
        success: true,
        message: 'Aadhaar OTP dispatched successfully to linked mobile number',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Verifies submitted Aadhaar OTP
   */
  static async verifyOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = verifyAadhaarOtpSchema.parse(req.body);
      const user = await DigiLockerService.verifyAadhaarOtp(
        req.user!.id,
        validated.txnId,
        validated.otp,
        req.ip
      );

      res.status(200).json({
        success: true,
        message: 'Aadhaar e-KYC verified successfully via DigiLocker',
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtains the DigiLocker OAuth2 authorization redirect URL
   */
  static async getAuthUrl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authUrl = DigiLockerService.getAuthorizationUrl(req.user!.id);
      res.status(200).json({
        success: true,
        data: { authUrl },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Exchanges DigiLocker OAuth authorization code
   */
  static async handleCallback(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = digilockerCallbackSchema.parse(req.body);
      const user = await DigiLockerService.handleOAuthCallback(
        req.user!.id,
        validated.code,
        validated.state,
        req.ip
      );

      res.status(200).json({
        success: true,
        message: 'DigiLocker account linked and Aadhaar verified successfully',
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * One-click sandbox instant connect simulation for testing & evaluations
   */
  static async simulateConnect(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await DigiLockerService.simulateDigiLockerConnect(req.user!.id, req.ip);
      res.status(200).json({
        success: true,
        message: 'Simulated DigiLocker Aadhaar e-KYC verification completed successfully',
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  }
}
