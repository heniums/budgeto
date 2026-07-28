import { Router } from 'express';
import { authenticate } from '../auth/middleware';
import { summaryHandler, listWidgetsHandler, saveWidgetsHandler } from './controller';

const router = Router();
router.use(authenticate);
router.get('/summary', summaryHandler);
router.get('/widgets', listWidgetsHandler);
router.post('/widgets', saveWidgetsHandler);

export default router;
