import { Router } from 'express';
import {
  createHandler,
  listHandler,
  getHandler,
  updateHandler,
  deleteHandler,
} from './controller';
import { authenticate } from '../auth/middleware';

const router = Router();
router.use(authenticate);

router.post('/', createHandler);
router.get('/', listHandler);
router.get('/:id', getHandler);
router.put('/:id', updateHandler);
router.delete('/:id', deleteHandler);

export default router;
