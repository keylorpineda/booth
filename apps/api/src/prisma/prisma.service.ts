import { Injectable, type OnModuleDestroy } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';

import { storeScope } from './store-scope';
import { type AppConfig } from '../config/app-config';
import { InjectConfig } from '../config/config.module';
import { PrismaClient } from '../generated/prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {
  constructor(@InjectConfig() config: AppConfig) {
    super({ adapter: new PrismaPg({ connectionString: config.databaseUrl }) });

    /*
     * Inside an owner request (StoreScopeInterceptor) every query made through this service goes
     * through the request's store-scoped transaction, so row-level security applies to services
     * without them knowing. Outside one, it is the plain client.
     */
    return new Proxy(this, {
      get(target, property, receiver) {
        if (property === 'unscoped') return target;
        const scope = storeScope.getStore();
        if (!scope) return Reflect.get(target, property, receiver);

        if (property === '$transaction') {
          // Already inside the request's transaction: run nested work in it.
          return async (work: unknown) => {
            if (typeof work === 'function') return (work as (tx: unknown) => unknown)(receiver);
            const results: unknown[] = [];
            for (const query of work as Promise<unknown>[]) results.push(await query);
            return results;
          };
        }
        if (typeof property === 'string' && property in scope.tx) {
          const value: unknown = Reflect.get(scope.tx, property);
          return typeof value === 'function' ? (value as () => unknown).bind(scope.tx) : value;
        }
        return Reflect.get(target, property, receiver);
      },
    });
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
