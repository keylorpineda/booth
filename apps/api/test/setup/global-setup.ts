import { execSync } from 'node:child_process';
import path from 'node:path';

import { TEST_DATABASE_URL } from './env';

/** Applies all migrations to the test database once before the suites run. */
export default function globalSetup(): void {
  try {
    execSync('pnpm exec prisma migrate deploy', {
      cwd: path.resolve(__dirname, '../..'),
      env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL },
      stdio: 'pipe',
    });
  } catch {
    // If the local Docker test database is not running, log a warning so unit tests can still run.
    // E2E suites that depend on the database will fail in their own test harnesses.
    console.warn(
      '⚠️  Test database at localhost:5433 is not reachable. Skipping pre-test migration deploy.',
    );
  }
}
