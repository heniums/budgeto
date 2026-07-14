import { Router } from 'express';
import {
  createTransactionHandler,
  listTransactionsHandler,
  listAllTransactionsHandler,
} from './controller';
import { authenticate } from '../auth/middleware';

const router = Router({ mergeParams: true });
router.use(authenticate);

router.post('/', createTransactionHandler);
router.get('/', listTransactionsHandler);

export default router;

// Top-level, user-scoped list endpoint (all of a user's transactions).
export const listRouter = Router();
listRouter.use(authenticate);
listRouter.get('/', listAllTransactionsHandler);
