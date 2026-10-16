import { existsSync } from 'node:fs';
import path from 'node:path';

/**
 * Loads `apps/api/.env` for local development. Variables already set in the environment win,
 * so CI and production (which set real env vars) are never affected.
 */
export function loadEnvFile(cwd = process.cwd()): void {
  const file = path.join(cwd, '.env');
  if (existsSync(file)) process.loadEnvFile(file);
}
