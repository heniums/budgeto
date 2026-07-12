import express, { type Express, type Request, type Response } from 'express';
import { z } from 'zod';
import { healthCheck } from './health';
import {
  registerHandler,
  loginHandler,
  meHandler,
  updateMeHandler,
  changePasswordHandler,
} from './auth/controller';
import { authenticate } from './auth/middleware';
import { isAppError } from './errors';

/**
 * Builds the Express application without starting the HTTP server. Exporting a
 * factory keeps the app testable and reusable across test suites.
 */
export function createApp(): Express {
  const app = express();
  app.use(express.json());

  app.get('/health', healthCheck);
  app.post('/auth/register', registerHandler);
  app.post('/auth/login', loginHandler);

  app.get('/auth/me', authenticate, meHandler);
  app.patch('/auth/me', authenticate, updateMeHandler);
  app.post('/auth/change-password', authenticate, changePasswordHandler);

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
