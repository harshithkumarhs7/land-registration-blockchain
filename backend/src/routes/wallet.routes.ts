import { Router } from 'express';
import { AuthController } from '../controllers/AuthController.js';
import { authenticateJwt } from '../middleware/auth.middleware.js';
import { validateRequest } from '../middleware/validate.middleware.js';
import { walletNonceSchema, walletVerifySchema } from '../validators/auth.validator.js';

const router = Router();

router.post('/nonce', validateRequest(walletNonceSchema), AuthController.getNonce);
router.post('/link', authenticateJwt, validateRequest(walletVerifySchema), AuthController.linkWallet);

export default router;
