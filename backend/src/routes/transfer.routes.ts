import { Router } from 'express';
import { TransferController } from '../controllers/TransferController.js';
import { authenticateJwt } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/rbac.middleware.js';
import { validateRequest } from '../middleware/validate.middleware.js';
import { createTransferSchema } from '../validators/transfer.validator.js';

const router = Router();

router.get('/', authenticateJwt, TransferController.getTransfers);
router.get('/eligible-buyers', authenticateJwt, TransferController.getEligibleBuyers);

router.post(
  '/',
  authenticateJwt,
  authorizeRoles('LAND_OWNER', 'BUYER', 'ADMIN'),
  validateRequest(createTransferSchema),
  TransferController.createTransfer
);

router.post(
  '/:id/approve',
  authenticateJwt,
  authorizeRoles('REGISTRAR', 'ADMIN'),
  TransferController.approveTransfer
);

router.post(
  '/:id/reject',
  authenticateJwt,
  authorizeRoles('REGISTRAR', 'ADMIN'),
  TransferController.rejectTransfer
);

export default router;
