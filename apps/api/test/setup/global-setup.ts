import { execSync } from 'node:child_process';
import path from 'node:path';

import { TEST_DATABASE_URL } from './env';

/** Applies all migrations to the test database once before the suites run. */
export default function globalSetup(): void {
  execSync('pnpm exec prisma migrate deploy', {
    cwd: path.resolve(__dirname, '../..'),
    env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL },
    stdio: 'pipe',
  });
}
