import { type INestApplication } from '@nestjs/common';
import request from 'supertest';
import { type App } from 'supertest/types';

import { TestController } from './fixtures/test.controller';
import { createTestApp } from './utils/create-test-app';

describe('HTTP security and docs', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    app = await createTestApp({ controllers: [TestController] });
  });

  afterAll(async () => {
    await app.close();
  });

  const http = () => request(app.getHttpServer());

  it('sets Helmet security headers and hides the framework', async () => {
    const response = await http().get('/api/test/ping').expect(200);

    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['content-security-policy']).toBeDefined();
    expect(response.headers['x-powered-by']).toBeUndefined();
  });

  it('allows CORS with credentials for allowlisted origins only', async () => {
    const allowed = await http()
      .get('/api/test/ping')
      .set('Origin', 'http://localhost:5173')
      .expect(200);
    expect(allowed.headers['access-control-allow-origin']).toBe('http://localhost:5173');
    expect(allowed.headers['access-control-allow-credentials']).toBe('true');

    const blocked = await http().get('/api/test/ping').set('Origin', 'https://evil.example');
    expect(blocked.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('serves the OpenAPI document and Swagger UI under /api/docs', async () => {
    const json = await http().get('/api/docs-json').expect(200);
    expect(json.body).toMatchObject({ openapi: expect.any(String), info: { title: 'Booth API' } });
    expect(Object.keys(json.body.paths as object)).toContain('/health');

    await http().get('/api/docs').expect(200).expect('Content-Type', /html/);
  });
});
