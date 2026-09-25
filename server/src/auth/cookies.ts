import type { Response } from 'express';
import { getConfig } from '../config';

export const REFRESH_COOKIE_NAME = 'budgeto_refresh_token';

/**
 * Sets the long-lived refresh-token cookie. It is `httpOnly` so it is
 * invisible to client-side JavaScript — the SPA never reads it. The
 * short-lived access token lives in client memory only.
 */
export function setRefreshCookie(
  res: Response,
  refreshToken: string,
  refreshExpiresAt: Date,
): void {
  const config = getConfig();
  const refreshMaxAge = refreshExpiresAt.getTime() - Date.now();

  res.cookie(REFRESH_COOKIE_NAME, refreshToken, {
    httpOnly: true,
    secure: config.cookieSecure,
    sameSite: config.cookieSameSite,
    path: '/',
    maxAge: refreshMaxAge,
  });
}

/**
 * Clears the refresh cookie. The `path` option must match the one used when
 * the cookie was set, otherwise the browser will ignore the removal.
 */
export function clearRefreshCookie(res: Response): void {
  res.clearCookie(REFRESH_COOKIE_NAME, { path: '/' });
}
