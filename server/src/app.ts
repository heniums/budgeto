import express, { type Express, type Request, type Response } from 'express';
import { z } from 'zod';
import { healthCheck } from './health';
import { authController } from './auth/controller';
import { authenticate } from './auth/middleware';
import { AppError } from './errors';

/**
 * Builds the Express application without starting the HTTP server. Exporting a
 * factory keeps the app testable and reusable across test suites.
 */
export function createApp(): Express {
  const app = express();
  app.use(express.json());

  app.get('/health', healthCheck);
  app.post('/auth/register', authController.register);
  app.post('/auth/login', authController.login);

  app.get('/auth/me', authenticate, (req: Request, res: Response) => {
    res.status(200).json({ user: req.user });
  });

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
      if (error instanceof AppError) {
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
