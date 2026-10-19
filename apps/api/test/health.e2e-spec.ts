import { type INestApplication } from '@nestjs/common';
import request from 'supertest';
import { type App } from 'supertest/types';

import { healthResponseSchema } from '@booth/shared';

import { createTestApp } from './utils/create-test-app';
import { PrismaService } from '../src/prisma/prisma.service';

describe('GET /health', () => {
  let app: INestApplication<App>;

  afterEach(async () => {
    await app.close();
  });

  it('returns 200 when the database is reachable', async () => {
    app = await createTestApp();

    const response = await request(app.getHttpServer()).get('/health').expect(200);

    expect(healthResponseSchema.parse(response.body)).toEqual({ status: 'ok', db: 'up' });
  });

  it('returns 503 when the database is down', async () => {
    app = await createTestApp({
      overrides: [
        {
          provide: PrismaService,
          useValue: {
            isHealthy: () => Promise.resolve(false),
            $disconnect: () => Promise.resolve(),
          },
        },
      ],
    });

    const response = await request(app.getHttpServer()).get('/health').expect(503);

    expect(response.body).toEqual({ status: 'error', db: 'down' });
  });

  it('is served outside the /api prefix', async () => {
    app = await createTestApp();

    await request(app.getHttpServer()).get('/api/health').expect(404);
  });
});
