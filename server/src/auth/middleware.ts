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
 * Guards an endpoint, requiring a valid access token. The token must be sent
 * as `Authorization: Bearer <token>` from the client — the server never stores
 * it. On success it attaches the decoded token payload to `req.user`;
 * otherwise it forwards an UnauthorizedError.
 */
export function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const header = req.headers.authorization ?? '';
  const [scheme, ...rest] = header.split(' ');
  // RFC 7235: the auth-scheme token is case-insensitive, so `bearer`,
  // `BEARER`, etc. must be accepted alongside the canonical `Bearer`.
  if (scheme.toLowerCase() !== 'bearer' || rest.join(' ').trim() === '') {
    next(unauthorizedError('Missing or invalid access token'));
    return;
  }
  const token = rest.join(' ').trim();
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
