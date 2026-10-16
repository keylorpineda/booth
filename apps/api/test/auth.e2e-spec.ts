import { type INestApplication } from '@nestjs/common';
import request from 'supertest';
import { type App } from 'supertest/types';

import { apiErrorSchema, authResponseSchema, sessionSchema } from '@booth/shared';

import { bearer, refreshCookieOf, registerOwner, setCookieHeader } from './utils/auth';
import { createTestApp } from './utils/create-test-app';
import { resetDatabase } from './utils/database';
import { PrismaService } from '../src/prisma/prisma.service';

describe('auth', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
  });

  beforeEach(async () => {
    await resetDatabase(prisma);
  });

  afterAll(async () => {
    await app.close();
  });

  const http = () => request(app.getHttpServer());
  const errorCode = (body: unknown) => apiErrorSchema.parse(body).error.code;

  describe('register', () => {
    it('creates an owner without a store and sets a secure refresh cookie', async () => {
      const response = await http()
        .post('/api/auth/register')
        .send({ name: 'Ana', email: 'Ana@Example.com', password: 'correct-horse-battery' })
        .expect(201);

      const body = authResponseSchema.parse(response.body);
      expect(body.user).toMatchObject({ email: 'ana@example.com', name: 'Ana', isDemo: false });
      expect(body.store).toBeNull();
      expect(body.accessTokenExpiresIn).toBe(900);

      const cookie = setCookieHeader(response).find((c) => c.startsWith('booth_rt='));
      expect(cookie).toMatch(/HttpOnly/);
      expect(cookie).toMatch(/Secure/);
      expect(cookie).toMatch(/SameSite=Lax/);
      expect(cookie).toMatch(/Path=\/api\/auth/);
    });

    it('stores an argon2id hash, never the password', async () => {
      await registerOwner(app, { email: 'hash@example.com', password: 'my-secret-pass' });

      const user = await prisma.user.findUniqueOrThrow({ where: { email: 'hash@example.com' } });
      expect(user.passwordHash).toMatch(/^\$argon2id\$/);
      expect(user.passwordHash).not.toContain('my-secret-pass');
    });

    it('rejects a duplicate email regardless of case', async () => {
      await registerOwner(app, { email: 'dup@example.com' });

      const response = await http()
        .post('/api/auth/register')
        .send({ name: 'Dup', email: 'DUP@example.com', password: 'correct-horse-battery' })
        .expect(409);
      expect(errorCode(response.body)).toBe('EMAIL_TAKEN');
    });

    it('validates the body', async () => {
      const response = await http()
        .post('/api/auth/register')
        .send({ name: '', email: 'nope', password: 'short' })
        .expect(400);
      expect(errorCode(response.body)).toBe('VALIDATION_ERROR');
    });
  });

  describe('login', () => {
    it('returns tokens for valid credentials', async () => {
      const owner = await registerOwner(app);

      const response = await http()
        .post('/api/auth/login')
        .send({ email: owner.email, password: owner.password })
        .expect(200);

      expect(authResponseSchema.parse(response.body).user.email).toBe(owner.email);
      expect(refreshCookieOf(response)).toMatch(/^booth_rt=.+/);
    });

    it('gives the same answer for a wrong password and an unknown email', async () => {
      const owner = await registerOwner(app);

      const wrong = await http()
        .post('/api/auth/login')
        .send({ email: owner.email, password: 'wrong-password' })
        .expect(401);
      const unknown = await http()
        .post('/api/auth/login')
        .send({ email: 'ghost@example.com', password: 'wrong-password' })
        .expect(401);

      expect(apiErrorSchema.parse(wrong.body).error).toMatchObject({
        code: 'INVALID_CREDENTIALS',
        message: apiErrorSchema.parse(unknown.body).error.message,
      });
    });
  });

  describe('access token', () => {
    it('returns the session on /me', async () => {
      const owner = await registerOwner(app);

      const response = await http()
        .get('/api/auth/me')
        .set('Authorization', bearer(owner.accessToken))
        .expect(200);

      expect(sessionSchema.parse(response.body)).toEqual({
        user: owner.body.user,
        store: null,
      });
    });

    it.each([
      ['missing', undefined],
      ['malformed', 'Bearer not-a-jwt'],
      ['wrong scheme', 'Basic abc'],
    ])('rejects a %s token with UNAUTHENTICATED', async (_case, header) => {
      const req = http().get('/api/auth/me');
      if (header) void req.set('Authorization', header);

      const response = await req.expect(401);
      expect(errorCode(response.body)).toBe('UNAUTHENTICATED');
    });

    it('rejects a tampered token', async () => {
      const owner = await registerOwner(app);
      const [header, , signature] = owner.accessToken.split('.');
      const forgedPayload = Buffer.from(JSON.stringify({ sub: 'someone-else' })).toString(
        'base64url',
      );

      await http()
        .get('/api/auth/me')
        .set('Authorization', bearer(`${header}.${forgedPayload}.${signature}`))
        .expect(401);
    });

    it('rejects a valid token whose user no longer exists', async () => {
      const owner = await registerOwner(app);
      await prisma.user.delete({ where: { id: owner.body.user.id } });

      await http().get('/api/auth/me').set('Authorization', bearer(owner.accessToken)).expect(401);
    });
  });

  describe('refresh rotation', () => {
    it('rotates the cookie and issues a working access token', async () => {
      const owner = await registerOwner(app);

      const response = await http()
        .post('/api/auth/refresh')
        .set('Cookie', owner.refreshCookie)
        .expect(200);

      const rotated = refreshCookieOf(response);
      expect(rotated).not.toBe(owner.refreshCookie);
      const { accessToken } = authResponseSchema.parse(response.body);
      await http().get('/api/auth/me').set('Authorization', bearer(accessToken)).expect(200);
    });

    it('revokes the whole family when an old token is reused', async () => {
      const owner = await registerOwner(app);
      const first = await http()
        .post('/api/auth/refresh')
        .set('Cookie', owner.refreshCookie)
        .expect(200);
      const latest = refreshCookieOf(first);

      // An attacker replays the original (already rotated) token.
      const reuse = await http()
        .post('/api/auth/refresh')
        .set('Cookie', owner.refreshCookie)
        .expect(401);
      expect(errorCode(reuse.body)).toBe('REFRESH_TOKEN_REUSED');

      // The legitimate latest token is now revoked too.
      const after = await http().post('/api/auth/refresh').set('Cookie', latest).expect(401);
      expect(errorCode(after.body)).toBe('REFRESH_TOKEN_REUSED');
    });

    it('lets at most one of two concurrent refreshes with the same token succeed', async () => {
      const owner = await registerOwner(app);

      const results = await Promise.all([
        http().post('/api/auth/refresh').set('Cookie', owner.refreshCookie),
        http().post('/api/auth/refresh').set('Cookie', owner.refreshCookie),
      ]);

      expect(results.filter((r) => r.status === 200).length).toBeLessThanOrEqual(1);
    });

    it('rejects a missing cookie and clears it', async () => {
      const response = await http().post('/api/auth/refresh').expect(401);

      expect(errorCode(response.body)).toBe('INVALID_REFRESH_TOKEN');
      expect(setCookieHeader(response).join()).toMatch(/booth_rt=;/);
    });

    it('rejects an expired refresh token', async () => {
      const owner = await registerOwner(app);
      await prisma.refreshToken.updateMany({ data: { expiresAt: new Date(Date.now() - 1000) } });

      const response = await http()
        .post('/api/auth/refresh')
        .set('Cookie', owner.refreshCookie)
        .expect(401);
      expect(errorCode(response.body)).toBe('INVALID_REFRESH_TOKEN');
    });
  });

  describe('logout', () => {
    it('revokes the session and clears the cookie', async () => {
      const owner = await registerOwner(app);

      const response = await http()
        .post('/api/auth/logout')
        .set('Cookie', owner.refreshCookie)
        .expect(204);
      expect(setCookieHeader(response).join()).toMatch(/booth_rt=;/);

      await http().post('/api/auth/refresh').set('Cookie', owner.refreshCookie).expect(401);
    });

    it('succeeds without a cookie', async () => {
      await http().post('/api/auth/logout').expect(204);
    });
  });

  it('documents the auth endpoints in Swagger', async () => {
    const response = await http().get('/api/docs-json').expect(200);
    const paths = Object.keys(response.body.paths as object);

    expect(paths).toEqual(
      expect.arrayContaining([
        '/api/auth/register',
        '/api/auth/login',
        '/api/auth/refresh',
        '/api/auth/logout',
        '/api/auth/me',
      ]),
    );
  });
});

describe('auth rate limit', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    app = await createTestApp({ env: { RATE_LIMIT_AUTH: '2' } });
  });

  afterAll(async () => {
    await app.close();
  });

  it('limits login attempts per client IP', async () => {
    const attempt = () =>
      request(app.getHttpServer())
        .post('/api/auth/login')
        .set('X-Forwarded-For', '192.0.2.77')
        .send({ email: 'a@example.com', password: 'x' });

    expect((await attempt()).status).toBe(401);
    expect((await attempt()).status).toBe(401);
    expect((await attempt()).status).toBe(429);
  });
});
