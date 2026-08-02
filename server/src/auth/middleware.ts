import type { Request, Response, NextFunction } from 'express';
import { verifyToken, type TokenPayload } from './token';
import { unauthorizedError } from '../errors';
import { ACCESS_COOKIE_NAME } from './cookies';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

/**
 * Guards an endpoint, requiring a valid access-token cookie. On success it
 * attaches the decoded token payload to `req.user`; otherwise it forwards an
 * UnauthorizedError.
 */
export function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const token = req.cookies?.[ACCESS_COOKIE_NAME];
  if (!token) {
    next(unauthorizedError('Missing or invalid access token'));
    return;
  }
  try {
    req.user = verifyToken(token);
    next();
  } catch {
    next(unauthorizedError('Invalid or expired access token'));
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
