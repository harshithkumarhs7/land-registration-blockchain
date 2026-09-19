import { Router } from 'express';
import { AdminController } from '../controllers/AdminController.js';
import { authenticateJwt } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/rbac.middleware.js';

const router = Router();

router.use(authenticateJwt);
router.use(authorizeRoles('ADMIN'));

router.get('/dashboard', AdminController.getDashboardStats);
router.get('/users', AdminController.getUsers);
router.put('/users/:id/status', AdminController.updateUserStatus);
router.get('/audit-logs', AdminController.getAuditLogs);

export default router;
