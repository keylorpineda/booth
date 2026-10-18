import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../../../..');

/**
 * Resets seeded demo stores so every Playwright test scenario and project
 * starts with pristine orders (PAN101 in PENDING, PAN108 in EXPIRED).
 */
export function resetDemoSeed(): void {
  try {
    const dbUrl =
      process.env.DATABASE_URL_TEST ??
      process.env.DATABASE_URL ??
      'postgresql://booth:booth@localhost:5433/booth_test?schema=public';
    execSync('node apps/api/dist/seed/cli.js', {
      cwd: rootDir,
      env: { ...process.env, DATABASE_URL: dbUrl },
      stdio: 'ignore',
    });
  } catch {
    // If database or seed script is unavailable, continue gracefully
  }
}
