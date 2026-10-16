import { HttpStatus, Injectable } from '@nestjs/common';

import { AppException } from '../common/errors/app.exception';
import { type Db } from '../prisma/prisma-tx';

export interface StockLine {
  productId: string;
  quantity: number;
  trackStock: boolean;
}

/**
 * Stock reservations. Must run inside the order's transaction so a failure rolls everything back.
 * Rows are updated in product-id order: concurrent orders lock rows in the same order, which
 * prevents deadlocks.
 */
@Injectable()
export class StockService {
  /** Atomically takes stock for tracked products, or throws OUT_OF_STOCK with the product ids. */
  async reserve(tx: Db, storeId: string, lines: readonly StockLine[]): Promise<void> {
    const tracked = lines
      .filter((line) => line.trackStock)
      .sort((a, b) => (a.productId < b.productId ? -1 : a.productId > b.productId ? 1 : 0));

    const unavailable: string[] = [];
    for (const line of tracked) {
      // Conditional update: never goes below zero, even with concurrent orders.
      const updated = await tx.$executeRaw`
        UPDATE "Product"
        SET "stock" = "stock" - ${line.quantity}, "updatedAt" = NOW()
        WHERE "id" = ${line.productId}
          AND "storeId" = ${storeId}
          AND "trackStock" = true
          AND "stock" >= ${line.quantity}
      `;
      if (updated === 0) unavailable.push(line.productId);
    }

    if (unavailable.length > 0) {
      throw new AppException(
        'OUT_OF_STOCK',
        'Some products are no longer available in that quantity',
        HttpStatus.CONFLICT,
        { productIds: unavailable },
      );
    }
  }

  /**
   * Gives back the stock reserved by these orders and clears the flags, so calling it twice for
   * the same order never releases twice.
   */
  async release(tx: Db, orderIds: readonly string[]): Promise<void> {
    if (orderIds.length === 0) return;
    const ids = [...orderIds];

    await tx.$executeRaw`
      UPDATE "Product" AS p
      SET "stock" = p."stock" + reserved.qty, "updatedAt" = NOW()
      FROM (
        SELECT "productId", SUM("quantity")::int AS qty
        FROM "OrderItem"
        WHERE "orderId" = ANY(${ids}::text[]) AND "stockReserved" = true AND "productId" IS NOT NULL
        GROUP BY "productId"
      ) AS reserved
      WHERE p."id" = reserved."productId"
    `;
    await tx.orderItem.updateMany({
      where: { orderId: { in: ids }, stockReserved: true },
      data: { stockReserved: false },
    });
  }
}
