import { type INestApplication } from '@nestjs/common';
import request from 'supertest';
import { type App } from 'supertest/types';

import { apiErrorSchema } from '@booth/shared';

import { TestController } from './fixtures/test.controller';
import { createTestApp } from './utils/create-test-app';

describe('error format and validation', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    app = await createTestApp({ controllers: [TestController] });
  });

  afterAll(async () => {
    await app.close();
  });

  const http = () => request(app.getHttpServer());

  it('accepts a valid body parsed by the shared Zod schema', async () => {
    const response = await http()
      .post('/api/test/echo')
      .send({ name: 'Pan', priceMinor: 150000, extra: 'dropped' })
      .expect(200);

    expect(response.body).toEqual({ name: 'Pan', priceMinor: 150000 });
  });

  it('returns VALIDATION_ERROR with field details for an invalid body', async () => {
    const response = await http()
      .post('/api/test/echo')
      .send({ name: 'P', priceMinor: 10.5 })
      .expect(400);

    const { error } = apiErrorSchema.parse(response.body);
    expect(error.code).toBe('VALIDATION_ERROR');
    expect(error.details?.fields).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: 'name' }),
        expect.objectContaining({ path: 'priceMinor' }),
      ]),
    );
  });

  it('uses the standard format for malformed JSON', async () => {
    const response = await http()
      .post('/api/test/echo')
      .set('Content-Type', 'application/json')
      .send('{"name":')
      .expect(400);

    expect(apiErrorSchema.parse(response.body).error.code).toBe('BAD_REQUEST');
  });

  it('keeps domain codes and details from AppException', async () => {
    const response = await http().get('/api/test/conflict').expect(409);

    expect(apiErrorSchema.parse(response.body).error).toMatchObject({
      code: 'CONFLICT',
      message: 'Slug already taken',
      details: { field: 'slug' },
    });
  });

  it('returns NOT_FOUND for unknown routes', async () => {
    const response = await http().get('/api/nope').expect(404);

    expect(apiErrorSchema.parse(response.body).error.code).toBe('NOT_FOUND');
  });

  it('hides internal details of unexpected errors', async () => {
    const response = await http().get('/api/test/boom').expect(500);

    const { error } = apiErrorSchema.parse(response.body);
    expect(error).toMatchObject({ code: 'INTERNAL_ERROR', message: 'Internal server error' });
    expect(JSON.stringify(response.body)).not.toContain('hunter2');
  });

  it('echoes the request id in the header and the error body', async () => {
    const response = await http().get('/api/nope').set('X-Request-Id', 'req-12345678').expect(404);

    expect(response.headers['x-request-id']).toBe('req-12345678');
    expect(apiErrorSchema.parse(response.body).error.requestId).toBe('req-12345678');
  });

  it('generates a request id when none (or an invalid one) is sent', async () => {
    const response = await http().get('/api/nope').set('X-Request-Id', 'bad id!').expect(404);

    const { requestId } = apiErrorSchema.parse(response.body).error;
    expect(requestId).toMatch(/^[0-9a-f-]{36}$/);
    expect(response.headers['x-request-id']).toBe(requestId);
  });
});
