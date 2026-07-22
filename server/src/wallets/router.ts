import { Router } from 'express';
import {
  createHandler,
  listHandler,
  getHandler,
  updateHandler,
  deleteHandler,
  adjustHandler,
} from './controller';
import { transferHandler } from '../transactions/controller';
import transactionsRouter from '../transactions/router';
import { authenticate } from '../auth/middleware';

const router = Router();
router.use(authenticate);

router.post('/transfer', transferHandler);

router.post('/', createHandler);
router.get('/', listHandler);
router.post('/:id/adjust', adjustHandler);
router.get('/:id', getHandler);
router.put('/:id', updateHandler);
router.delete('/:id', deleteHandler);

router.use('/:id/transactions', transactionsRouter);

export default router;
