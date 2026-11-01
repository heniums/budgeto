import { Router, type Request, type Response } from 'express';
import rateLimit from 'express-rate-limit';
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

const jsonHandler = (_req: Request, res: Response) => {
  res.status(429).json({
    code: 'RATE_LIMITED',
    message: 'Too many requests. Please try again later.',
  });
};

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',
  handler: jsonHandler,
});

const sessionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 60,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',
  handler: jsonHandler,
});

const router = Router();

router.post('/register', authLimiter, registerHandler);
router.post('/login', authLimiter, loginHandler);
router.post('/refresh', sessionLimiter, refreshHandler);
router.post('/logout', sessionLimiter, logoutHandler);
router.get('/me', authenticate, meHandler);
router.patch('/me', authenticate, updateMeHandler);
router.post('/change-password', authenticate, changePasswordHandler);

export default router;
