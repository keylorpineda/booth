// Runs before every test file (jest `setupFiles`). Tests never read apps/api/.env.
// Every suite talks to the separate test database (docker compose `db-test`, port 5433).
export const TEST_DATABASE_URL =
  process.env.DATABASE_URL_TEST ??
  'postgresql://booth:booth@localhost:5433/booth_test?schema=public';

Object.assign(process.env, {
  NODE_ENV: 'test',
  LOG_LEVEL: 'silent',
  DATABASE_URL: TEST_DATABASE_URL,
  TRUST_PROXY: '1',
  CORS_ORIGINS: 'http://localhost:5173',
  WEB_PUBLIC_URL: 'http://localhost:5173',
  JWT_ACCESS_SECRET: 'test-secret-that-is-long-enough-for-hs256-signing',
});
