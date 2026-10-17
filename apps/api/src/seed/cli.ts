import { existsSync } from 'node:fs';
import path from 'node:path';

import { PrismaPg } from '@prisma/adapter-pg';

import { seedDemoData } from './seed-runner';
import { PrismaClient } from '../generated/prisma/client';

const envFile = path.join(process.cwd(), '.env');
if (existsSync(envFile)) process.loadEnvFile(envFile);

export async function runSeedCli(): Promise<void> {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is required to run the database seed');
  }
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
  try {
    await seedDemoData(prisma);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  void runSeedCli();
}
