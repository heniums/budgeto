import cors from 'cors';
import express, { type Express, type Request, type Response } from 'express';
import { z } from 'zod';
import { healthCheck } from './health';
import authRouter from './auth/router';
import walletsRouter from './wallets/router';
import categoriesRouter from './categories/router';
import { listRouter as transactionsListRouter } from './transactions/router';
import { isAppError } from './errors';

export function createApp(): Express {
  const app = express();
  app.use(cors({ origin: 'http://localhost:5173' }));
  app.use(express.json());

  app.get('/health', healthCheck);
  app.use('/auth', authRouter);
  app.use('/wallets', walletsRouter);
  app.use('/categories', categoriesRouter);
  app.use('/transactions', transactionsListRouter);

  app.use(
    (
      error: unknown,
      _req: Request,
      res: Response,
      _next: express.NextFunction,
    ) => {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: error.issues.map((issue) => ({
            path: issue.path.join('.'),
            message: issue.message,
          })),
        });
        return;
      }
      if (isAppError(error)) {
        res.status(error.statusCode).json({
          code: error.code,
          message: error.message,
        });
        return;
      }
      const message =
        error instanceof Error ? error.message : 'Internal Server Error';
      res.status(500).json({ code: 'INTERNAL_ERROR', message });
    },
  );

  return app;
}
