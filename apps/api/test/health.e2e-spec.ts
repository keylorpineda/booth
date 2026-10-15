import { type INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { type App } from 'supertest/types';

import { healthResponseSchema } from '@booth/shared';

import { AppModule } from '../src/app.module';

describe('GET /health', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns ok', async () => {
    const response = await request(app.getHttpServer()).get('/health').expect(200);

    expect(healthResponseSchema.parse(response.body)).toEqual({ status: 'ok' });
  });
});
