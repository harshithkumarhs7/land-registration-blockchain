import { Router } from 'express';
import { RegistrationController } from '../controllers/RegistrationController.js';
import { authenticateJwt } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/rbac.middleware.js';

const router = Router();

router.get(
  '/',
  authenticateJwt,
  authorizeRoles('REGISTRAR', 'ADMIN'),
  RegistrationController.getApplications
);

router.get(
  '/:id',
  authenticateJwt,
  RegistrationController.getApplicationById
);

router.post(
  '/:id/approve',
  authenticateJwt,
  authorizeRoles('REGISTRAR', 'ADMIN'),
  RegistrationController.approveApplication
);

router.post(
  '/:id/reject',
  authenticateJwt,
  authorizeRoles('REGISTRAR', 'ADMIN'),
  RegistrationController.rejectApplication
);

export default router;
