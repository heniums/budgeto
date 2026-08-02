import { Router } from 'express';
import {
  registerHandler,
  loginHandler,
  meHandler,
  updateMeHandler,
  changePasswordHandler,
  refreshHandler,
  logoutHandler,
} from './controller';
import { authenticate } from './middleware';

const router = Router();

router.post('/register', registerHandler);
router.post('/login', loginHandler);
router.post('/refresh', refreshHandler);
router.post('/logout', logoutHandler);
router.get('/me', authenticate, meHandler);
router.patch('/me', authenticate, updateMeHandler);
router.post('/change-password', authenticate, changePasswordHandler);

export default router;
