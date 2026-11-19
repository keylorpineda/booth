import { type INestApplication } from '@nestjs/common';
import request from 'supertest';
import { type App } from 'supertest/types';

import { healthResponseSchema, livenessResponseSchema } from '@booth/shared';

import { createTestApp } from './utils/create-test-app';
import { PrismaService } from '../src/prisma/prisma.service';

const databaseDown = {
  provide: PrismaService,
  useValue: {
    isHealthy: () => Promise.resolve(false),
    $disconnect: () => Promise.resolve(),
  },
};

describe('health checks', () => {
  let app: INestApplication<App>;

  afterEach(async () => {
    await app.close();
  });

  describe('GET /health', () => {
    it('answers 200 without touching the database, even when it is down', async () => {
      app = await createTestApp({ overrides: [databaseDown] });

      const response = await request(app.getHttpServer()).get('/health').expect(200);

      expect(livenessResponseSchema.parse(response.body)).toEqual({ status: 'ok' });
    });

    it('is served outside the /api prefix', async () => {
      app = await createTestApp();

      await request(app.getHttpServer()).get('/api/health').expect(404);
    });
  });

  describe('GET /health/db', () => {
    it('returns 200 when the database is reachable', async () => {
      app = await createTestApp();

      const response = await request(app.getHttpServer()).get('/health/db').expect(200);

      expect(healthResponseSchema.parse(response.body)).toEqual({ status: 'ok', db: 'up' });
    });

    it('returns 503 when the database is down', async () => {
      app = await createTestApp({ overrides: [databaseDown] });

      const response = await request(app.getHttpServer()).get('/health/db').expect(503);

      expect(response.body).toEqual({ status: 'error', db: 'down' });
    });
  });
});
