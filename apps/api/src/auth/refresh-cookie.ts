import { type CookieOptions, type Request, type Response } from 'express';

import { type IssuedRefreshToken } from './refresh-token.service';

export const REFRESH_COOKIE = 'booth_rt';

/**
 * First-party cookie: the browser reaches the API through the web origin (Vercel rewrite), so
 * `SameSite=Lax` is enough and no cross-site cookie is needed. Scoped to the auth routes only.
 */
const baseOptions: CookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: 'lax',
  path: '/api/auth',
};

export function setRefreshCookie(res: Response, { token, expiresAt }: IssuedRefreshToken): void {
  res.cookie(REFRESH_COOKIE, token, { ...baseOptions, expires: expiresAt });
}

export function clearRefreshCookie(res: Response): void {
  res.clearCookie(REFRESH_COOKIE, baseOptions);
}

export function readRefreshCookie(req: Request): string | null {
  const value: unknown = req.cookies[REFRESH_COOKIE];
  return typeof value === 'string' && value.length > 0 ? value : null;
}
