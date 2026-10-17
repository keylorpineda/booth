import { existsSync } from 'node:fs';
import path from 'node:path';

import { defineConfig } from 'prisma/config';

// Prisma 7 no longer loads .env files itself (scripts run from apps/api). Real values come from the environment in CI/production.
const envFile = path.join(process.cwd(), '.env');
if (existsSync(envFile)) process.loadEnvFile(envFile);

export default defineConfig({
  schema: path.join('prisma', 'schema.prisma'),
  migrations: {
    path: path.join('prisma', 'migrations'),
    seed: 'pnpm db:seed',
  },
  // Omitted when unset so `prisma generate` works without a database (e.g. on install).
  ...(process.env.DATABASE_URL && { datasource: { url: process.env.DATABASE_URL } }),
});
