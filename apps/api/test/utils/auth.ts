import { type INestApplication } from '@nestjs/common';
import request, { type Response } from 'supertest';
import { type App } from 'supertest/types';

import { type AuthResponse, authResponseSchema } from '@booth/shared';

let counter = 0;

export interface TestOwner {
  email: string;
  password: string;
  accessToken: string;
  refreshCookie: string;
  body: AuthResponse;
}

/** Registers a fresh owner account and returns its tokens. */
export async function registerOwner(
  app: INestApplication<App>,
  overrides: Partial<{ email: string; password: string; name: string }> = {},
): Promise<TestOwner> {
  counter += 1;
  const email = overrides.email ?? `owner${counter}@example.com`;
  const password = overrides.password ?? 'correct-horse-battery';
  const response = await request(app.getHttpServer())
    .post('/api/auth/register')
    .set('X-Forwarded-For', `198.51.100.${counter % 250}`)
    .send({ name: overrides.name ?? `Owner ${counter}`, email, password })
    .expect(201);

  const body = authResponseSchema.parse(response.body);
  return {
    email,
    password,
    accessToken: body.accessToken,
    refreshCookie: refreshCookieOf(response),
    body,
  };
}

/** The `booth_rt=<value>` pair from a response, ready for a `Cookie` header. */
export function refreshCookieOf(response: Response): string {
  const header = setCookieHeader(response).find((cookie) => cookie.startsWith('booth_rt='));
  if (!header) throw new Error('No refresh cookie in response');
  return header.split(';')[0] ?? '';
}

export function setCookieHeader(response: Response): string[] {
  const header = response.headers['set-cookie'] as string[] | string | undefined;
  if (!header) return [];
  return Array.isArray(header) ? header : [header];
}

export const bearer = (token: string): string => `Bearer ${token}`;
