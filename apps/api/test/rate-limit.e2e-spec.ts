import { type INestApplication } from '@nestjs/common';
import request from 'supertest';
import { type App } from 'supertest/types';

import { apiErrorSchema } from '@booth/shared';

import { TestController } from './fixtures/test.controller';
import { createTestApp } from './utils/create-test-app';

describe('rate limiting', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    app = await createTestApp({
      controllers: [TestController],
      env: { RATE_LIMIT_DEFAULT: '3', RATE_LIMIT_AUTH: '2' },
    });
  });

  afterEach(async () => {
    await app.close();
  });

  const get = (path: string, clientIp: string) =>
    request(app.getHttpServer()).get(path).set('X-Forwarded-For', clientIp);

  it('returns 429 RATE_LIMITED in the standard format with Retry-After', async () => {
    for (let i = 0; i < 3; i++) await get('/api/test/ping', '203.0.113.10').expect(200);

    const response = await get('/api/test/ping', '203.0.113.10').expect(429);

    expect(apiErrorSchema.parse(response.body).error.code).toBe('RATE_LIMITED');
    expect(response.headers['retry-after']).toBeDefined();
  });

  it('tracks clients by the real IP from X-Forwarded-For (trust proxy)', async () => {
    for (let i = 0; i < 3; i++) await get('/api/test/ping', '203.0.113.20').expect(200);
    await get('/api/test/ping', '203.0.113.20').expect(429);

    await get('/api/test/ping', '203.0.113.21').expect(200);
  });

  it('applies the stricter auth bucket only to marked routes', async () => {
    await get('/api/test/auth-ping', '203.0.113.30').expect(200);
    await get('/api/test/auth-ping', '203.0.113.30').expect(200);
    await get('/api/test/auth-ping', '203.0.113.30').expect(429);

    // The same client still has default-bucket budget left on unmarked routes.
    await get('/api/test/ping', '203.0.113.30').expect(200);
  });

  it('never limits the health check', async () => {
    for (let i = 0; i < 5; i++) await get('/health', '203.0.113.40').expect(200);
  });
});
