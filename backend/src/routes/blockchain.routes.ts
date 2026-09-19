import { Router } from 'express';
import { BlockchainController } from '../controllers/BlockchainController.js';

const router = Router();

router.get('/status', BlockchainController.getStatus);
router.get('/transactions', BlockchainController.getTransactions);
router.get('/transactions/:hash', BlockchainController.getTransactionByHash);
router.get('/lands/:propertyId', BlockchainController.getLandFromChain);
router.post('/verify/:propertyId', BlockchainController.verifyDocumentOnChain);

export default router;
