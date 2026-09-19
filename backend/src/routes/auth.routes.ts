import { Router } from 'express';
import { AuthController } from '../controllers/AuthController.js';
import { authenticateJwt } from '../middleware/auth.middleware.js';
import { validateRequest } from '../middleware/validate.middleware.js';
import { registerSchema, loginSchema } from '../validators/auth.validator.js';

const router = Router();

router.post('/register', validateRequest(registerSchema), AuthController.register);
router.post('/login', validateRequest(loginSchema), AuthController.login);
router.get('/me', authenticateJwt, AuthController.me);
router.post('/logout', authenticateJwt, AuthController.logout);

export default router;
