import { Router } from 'express';
import { createTransactionHandler, listTransactionsHandler } from './controller';
import { authenticate } from '../auth/middleware';

const router = Router({ mergeParams: true });
router.use(authenticate);

router.post('/', createTransactionHandler);
router.get('/', listTransactionsHandler);

export default router;
