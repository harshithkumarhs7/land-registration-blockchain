import { Router } from 'express';
import { KycController } from '../controllers/KycController.js';
import { authenticateJwt } from '../middleware/auth.middleware.js';
import { validateRequest } from '../middleware/validate.middleware.js';
import {
  requestAadhaarOtpSchema,
  verifyAadhaarOtpSchema,
  digilockerCallbackSchema,
} from '../validators/kyc.validator.js';

const router = Router();

// All KYC endpoints require user authentication
router.use(authenticateJwt);

router.get('/status', KycController.getStatus);
router.post('/aadhaar/otp-request', validateRequest(requestAadhaarOtpSchema), KycController.requestOtp);
router.post('/aadhaar/otp-verify', validateRequest(verifyAadhaarOtpSchema), KycController.verifyOtp);
router.get('/digilocker/auth-url', KycController.getAuthUrl);
router.post('/digilocker/callback', validateRequest(digilockerCallbackSchema), KycController.handleCallback);
router.post('/digilocker/simulate', KycController.simulateConnect);

export default router;
