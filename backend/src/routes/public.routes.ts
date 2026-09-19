import { Router } from 'express';
import { PublicController } from '../controllers/PublicController.js';

const router = Router();

router.get('/lands', PublicController.searchLands);
router.get('/verify/:propertyId', PublicController.verifyProperty);

export default router;
