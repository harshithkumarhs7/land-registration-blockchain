import { Router } from 'express';
import { DocumentController } from '../controllers/DocumentController.js';
import { authenticateJwt } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/rbac.middleware.js';
import { uploadMiddleware } from '../middleware/upload.middleware.js';

const router = Router();

router.post(
  '/upload',
  authenticateJwt,
  uploadMiddleware.single('file'),
  DocumentController.upload
);

router.get('/:id/download', DocumentController.download);

router.post(
  '/:id/verify-file',
  uploadMiddleware.single('file'),
  DocumentController.verifyFile
);

router.put(
  '/:id/status',
  authenticateJwt,
  authorizeRoles('REGISTRAR', 'ADMIN'),
  DocumentController.updateStatus
);

export default router;
