import { Router } from 'express';
import { LandController } from '../controllers/LandController.js';
import { authenticateJwt } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/rbac.middleware.js';
import { validateRequest } from '../middleware/validate.middleware.js';
import { createLandSchema, searchLandSchema } from '../validators/land.validator.js';

const router = Router();

router.get('/', validateRequest(searchLandSchema, 'query'), LandController.getLands);
router.get('/my-properties', authenticateJwt, LandController.getMyLands);
router.get('/:id', LandController.getLandById);
router.post(
  '/',
  authenticateJwt,
  authorizeRoles('LAND_OWNER', 'ADMIN'),
  validateRequest(createLandSchema),
  LandController.createLand
);

export default router;
