import { Injectable, Logger } from '@nestjs/common';

import { StockService } from './stock.service';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Expires unconfirmed orders whose window has passed and releases their stock.
 * Runs lazily (before creating orders, when reading them) and on a schedule, because the free
 * hosting instance sleeps and a timer alone cannot be trusted.
 */
@Injectable()
export class OrderExpirationService {
  private readonly logger = new Logger(OrderExpirationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly stock: StockService,
  ) {}

  /** Returns how many orders expired. Safe to run concurrently: each order expires once. */
  async expireStale(storeId?: string): Promise<number> {
    const storeFilter = storeId ? Prisma.sql`AND "storeId" = ${storeId}` : Prisma.empty;

    const expired = await this.prisma.$transaction(async (tx) => {
      // The status condition makes this exactly-once: a concurrent run waits for the row lock,
      // re-checks the status and skips orders that are no longer PENDING.
      const rows = await tx.$queryRaw<{ id: string }[]>`
        UPDATE "Order"
        SET "status" = 'EXPIRED'::"OrderStatus",
            "expiredAt" = NOW(),
            "expiresAt" = NULL,
            "updatedAt" = NOW()
        WHERE "status" = 'PENDING'::"OrderStatus"
          AND "expiresAt" IS NOT NULL
          AND "expiresAt" < NOW()
          ${storeFilter}
        RETURNING "id"
      `;
      const ids = rows.map((row) => row.id);
      if (ids.length === 0) return 0;

      await this.stock.release(tx, ids);
      await tx.orderStatusEvent.createMany({
        data: ids.map((orderId) => ({ orderId, status: 'EXPIRED' as const, actor: 'system' })),
      });
      return ids.length;
    });

    if (expired > 0) this.logger.log({ expired, storeId }, 'Expired unconfirmed orders');
    return expired;
  }
}
