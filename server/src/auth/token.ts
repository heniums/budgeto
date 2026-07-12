import jwt from 'jsonwebtoken';
import { getConfig } from '../config';

export interface TokenPayload {
  sub: string;
  email: string;
}

/**
 * Signs a short-lived JWT for an authenticated user.
 */
export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, getConfig().jwtSecret, {
    expiresIn: getConfig().jwtExpiresIn,
  });
}

/**
 * Verifies and decodes a JWT. Throws if the token is malformed or expired.
 */
export function verifyToken(token: string): TokenPayload {
  const decoded = jwt.verify(token, getConfig().jwtSecret) as jwt.JwtPayload;
  return {
    sub: String(decoded.sub),
    email: String(decoded.email),
  };
}
