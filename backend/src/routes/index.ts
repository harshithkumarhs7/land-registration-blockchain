import { Router } from 'express';
import authRoutes from './auth.routes.js';
import walletRoutes from './wallet.routes.js';
import landRoutes from './land.routes.js';
import registrationRoutes from './registration.routes.js';
import documentRoutes from './document.routes.js';
import transferRoutes from './transfer.routes.js';
import blockchainRoutes from './blockchain.routes.js';
import adminRoutes from './admin.routes.js';
import notificationRoutes from './notification.routes.js';
import publicRoutes from './public.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/wallet', walletRoutes);
router.use('/lands', landRoutes);
router.use('/registrations', registrationRoutes);
router.use('/documents', documentRoutes);
router.use('/transfers', transferRoutes);
router.use('/blockchain', blockchainRoutes);
router.use('/admin', adminRoutes);
router.use('/notifications', notificationRoutes);
router.use('/public', publicRoutes);

export default router;
