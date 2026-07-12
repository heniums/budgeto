import type { Request, Response } from 'express';

/**
 * Liveness/readiness probe used by health checks and the smoke test.
 */
export function healthCheck(_req: Request, res: Response): void {
  res.status(200).json({ status: 'ok' });
}
