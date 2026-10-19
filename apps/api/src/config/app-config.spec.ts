import { ConfigValidationError, loadConfig } from './app-config';

const validEnv = {
  NODE_ENV: 'production',
  PORT: '8080',
  TRUST_PROXY: '2',
  CORS_ORIGINS: 'https://booth.example, https://www.booth.example',
  WEB_PUBLIC_URL: 'https://booth.example',
  DATABASE_URL: 'postgresql://user:pass@db.example:5432/booth',
  JWT_ACCESS_SECRET: 'x'.repeat(32),
  CLOUDINARY_CLOUD_NAME: 'demo-cloud',
  CLOUDINARY_API_KEY: '123',
  CLOUDINARY_API_SECRET: 'secret',
};

describe('loadConfig', () => {
  it('maps a valid environment to a typed config with defaults', () => {
    const config = loadConfig(validEnv);

    expect(config).toMatchObject({
      env: 'production',
      isProduction: true,
      port: 8080,
      trustProxy: 2,
      corsOrigins: ['https://booth.example', 'https://www.booth.example'],
      rateLimit: { ttlMs: 60_000, default: 120, auth: 10, publicOrders: 20 },
    });
  });

  it.each([
    ['true', true],
    ['false', false],
    ['loopback', 'loopback'],
  ])('parses TRUST_PROXY=%s', (value, expected) => {
    expect(loadConfig({ ...validEnv, TRUST_PROXY: value }).trustProxy).toBe(expected);
  });

  it('fails with a readable message listing every invalid variable', () => {
    const run = () =>
      loadConfig({ ...validEnv, DATABASE_URL: 'mysql://nope', PORT: 'abc', CORS_ORIGINS: 'x' });

    expect(run).toThrow(ConfigValidationError);
    expect(run).toThrow(/DATABASE_URL: Must be a PostgreSQL connection URL/);
    expect(run).toThrow(/PORT:/);
    expect(run).toThrow(/CORS_ORIGINS/);
  });

  it('rejects the example JWT secret in production', () => {
    expect(() =>
      loadConfig({ ...validEnv, JWT_ACCESS_SECRET: 'change-me-to-at-least-32-random-characters' }),
    ).toThrow(/JWT_ACCESS_SECRET: Replace the example value/);
  });

  it('treats Cloudinary as optional in development but all-or-nothing', () => {
    const dev = { ...validEnv, NODE_ENV: 'development' };
    const noCloudinary = {
      ...dev,
      CLOUDINARY_CLOUD_NAME: '',
      CLOUDINARY_API_KEY: '',
      CLOUDINARY_API_SECRET: '',
    };
    expect(loadConfig(noCloudinary).cloudinary).toBeNull();
    expect(() => loadConfig({ ...noCloudinary, CLOUDINARY_API_KEY: '123' })).toThrow(
      /Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET together/,
    );
  });

  it('requires Cloudinary in production', () => {
    expect(() =>
      loadConfig({
        ...validEnv,
        CLOUDINARY_CLOUD_NAME: '',
        CLOUDINARY_API_KEY: '',
        CLOUDINARY_API_SECRET: '',
      }),
    ).toThrow(/Cloudinary credentials are required in production/);
  });

  it('reports missing required variables', () => {
    expect(() => loadConfig({})).toThrow(/WEB_PUBLIC_URL/);
  });
});
