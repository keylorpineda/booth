import { Injectable, type OnModuleDestroy } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';

import { type AppConfig } from '../config/app-config';
import { InjectConfig } from '../config/config.module';
import { PrismaClient } from '../generated/prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {
  constructor(@InjectConfig() config: AppConfig) {
    super({ adapter: new PrismaPg({ connectionString: config.databaseUrl }) });
  }

  /** True when the database answers a trivial query within the timeout. */
  async isHealthy(timeoutMs = 2000): Promise<boolean> {
    let timer: NodeJS.Timeout | undefined;
    const timeout = new Promise<false>((resolve) => {
      timer = setTimeout(() => {
        resolve(false);
      }, timeoutMs);
    });

    try {
      const ping = this.$queryRaw`SELECT 1`.then(() => true);
      return await Promise.race([ping, timeout]);
    } catch {
      return false;
    } finally {
      clearTimeout(timer);
    }
  }

  /**
   * The client outside any store scope, for deliberate cross-store lookups inside an owner request
   * (e.g. "is this custom domain used by another store?"). Never write tenant data through it.
   */
  get unscoped(): PrismaClient {
    return this;
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
