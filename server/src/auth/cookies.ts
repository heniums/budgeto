import type { Response } from 'express';
import { getConfig } from '../config';

export const ACCESS_COOKIE_NAME = 'budgeto_access_token';
export const REFRESH_COOKIE_NAME = 'budgeto_refresh_token';

/**
 * Sets both the short-lived access-token cookie and the longer-lived
 * refresh-token cookie on the response. Both are `httpOnly` so they are
 * invisible to client-side JavaScript.
 */
export function setAuthCookies(
  res: Response,
  accessToken: string,
  refreshToken: string,
  refreshExpiresAt: Date,
): void {
  const config = getConfig();
  const now = Date.now();
  const refreshMaxAge = refreshExpiresAt.getTime() - now;

  res.cookie(ACCESS_COOKIE_NAME, accessToken, {
    httpOnly: true,
    secure: config.cookieSecure,
    sameSite: config.cookieSameSite,
    path: '/',
    maxAge: config.jwtExpiresIn * 1000,
  });

  res.cookie(REFRESH_COOKIE_NAME, refreshToken, {
    httpOnly: true,
    secure: config.cookieSecure,
    sameSite: config.cookieSameSite,
    path: '/',
    maxAge: refreshMaxAge,
  });
}

/**
 * Clears both auth cookies. The `path` option must match the one used when
 * the cookies were set, otherwise the browser will ignore the removal.
 */
export function clearAuthCookies(res: Response): void {
  res.clearCookie(ACCESS_COOKIE_NAME, { path: '/' });
  res.clearCookie(REFRESH_COOKIE_NAME, { path: '/' });
}
