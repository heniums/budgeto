import type { Request, Response, NextFunction } from 'express';
import { verifyToken, type TokenPayload } from './token';
import { unauthorizedError } from '../errors';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

/**
 * Guards an endpoint, requiring a valid Bearer JWT. On success it attaches the
 * decoded token payload to `req.user`; otherwise it forwards an UnauthorizedError.
 */
export function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    next(unauthorizedError('Missing or invalid Authorization header'));
    return;
  }
  const token = header.slice('Bearer '.length);
  try {
    req.user = verifyToken(token);
    next();
  } catch {
    next(unauthorizedError('Invalid or expired token'));
  }
}

/**
 * Extracts the authenticated user from a request that has passed through the
 * `authenticate` middleware. This is a pure type-narrowing convenience — it
 * does not re-check auth (the middleware already guarantees `req.user` is set).
 */
export function getUser(req: Request): TokenPayload {
  return req.user as TokenPayload;
}
