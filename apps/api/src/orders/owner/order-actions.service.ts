import { HttpStatus, Inject, Injectable } from '@nestjs/common';

import {
  canTransition,
  type OrderStatus,
  type OwnerOrder,
  type ReceiptUrl,
  type UpdateOrderStatusInput,
  type UpdatePaymentStatusInput,
} from '@booth/shared';

import { OwnerOrdersService } from './owner-orders.service';
import { AppException } from '../../common/errors/app.exception';
import { notFound } from '../../common/errors/not-found';
import { type AppConfig } from '../../config/app-config';
import { InjectConfig } from '../../config/config.module';
import {
  MEDIA_STORAGE,
  type MediaStorage,
  type PrivateFileFormat,
} from '../../media/media-storage';
import { type Db } from '../../prisma/prisma-tx';
import { PrismaService } from '../../prisma/prisma.service';
import { OrderExpirationService } from '../order-expiration.service';
import { StockService } from '../stock.service';

const MINUTE_MS = 60_000;

/** Timestamp column set when an order enters a status. */
const STATUS_TIMESTAMP: Partial<
  Record<OrderStatus, 'confirmedAt' | 'completedAt' | 'cancelledAt'>
> = {
  CONFIRMED: 'confirmedAt',
  COMPLETED: 'completedAt',
  CANCELLED: 'cancelledAt',
};

/** Write side of the owner's orders: status changes, payment, reactivation, receipts. */
@Injectable()
export class OrderActionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly orders: OwnerOrdersService,
    private readonly stock: StockService,
    private readonly expiration: OrderExpirationService,
    @Inject(MEDIA_STORAGE) private readonly storage: MediaStorage,
    @InjectConfig() private readonly config: AppConfig,
  ) {}

  async changeStatus(
    storeId: string,
    id: string,
    input: UpdateOrderStatusInput,
  ): Promise<OwnerOrder> {
    // An order whose window passed must expire first; it cannot be confirmed afterwards.
    await this.expiration.expireStale(storeId);

    await this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findFirst({ where: { id, storeId }, select: { status: true } });
      if (!order) throw notFound('Order');
      if (!canTransition(order.status, input.status))
        throw invalidTransition(order.status, input.status);

      const timestamp = STATUS_TIMESTAMP[input.status];
      // Conditional on the status we read: a concurrent change makes this a no-op.
      const { count } = await tx.order.updateMany({
        where: { id, status: order.status },
        data: {
          status: input.status,
          expiresAt: null, // only PENDING orders expire
          ...(timestamp && { [timestamp]: new Date() }),
        },
      });
      if (count === 0) throw invalidTransition(order.status, input.status);

      if (input.status === 'CANCELLED') await this.stock.release(tx, [id]);
      await tx.orderStatusEvent.create({
        data: { orderId: id, status: input.status, actor: 'owner', note: input.note ?? null },
      });
    });
    return this.orders.get(storeId, id);
  }

  async changePayment(
    storeId: string,
    id: string,
    input: UpdatePaymentStatusInput,
  ): Promise<OwnerOrder> {
    const order = await this.prisma.order.findFirst({
      where: { id, storeId },
      select: { status: true },
    });
    if (!order) throw notFound('Order');
    if (order.status === 'CANCELLED' || order.status === 'EXPIRED') {
      throw new AppException(
        'INVALID_STATUS_TRANSITION',
        'Payment cannot change on a cancelled or expired order',
        HttpStatus.CONFLICT,
      );
    }

    await this.prisma.order.update({
      where: { id },
      data: {
        paymentStatus: input.paymentStatus,
        // A paid order never expires.
        ...(input.paymentStatus === 'PAID' && { expiresAt: null }),
      },
    });
    return this.orders.get(storeId, id);
  }

  /** EXPIRED -> PENDING: re-reserves tracked stock (or fails with OUT_OF_STOCK) and restarts the window. */
  async reactivate(storeId: string, id: string): Promise<OwnerOrder> {
    await this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findFirst({
        where: { id, storeId },
        include: { items: true, store: { select: { orderExpirationMinutes: true } } },
      });
      if (!order) throw notFound('Order');
      if (order.status !== 'EXPIRED') throw invalidTransition(order.status, 'PENDING');

      const reserved = await this.reserveAgain(tx, storeId, order.items);
      const { count } = await tx.order.updateMany({
        where: { id, status: 'EXPIRED' },
        data: {
          status: 'PENDING',
          expiredAt: null,
          expiresAt: new Date(Date.now() + order.store.orderExpirationMinutes * MINUTE_MS),
        },
      });
      if (count === 0) throw invalidTransition(order.status, 'PENDING');

      await tx.orderItem.updateMany({
        where: { id: { in: reserved } },
        data: { stockReserved: true },
      });
      await tx.orderStatusEvent.create({
        data: { orderId: id, status: 'PENDING', actor: 'owner', note: 'Reactivated' },
      });
    });
    return this.orders.get(storeId, id);
  }

  async receiptUrl(storeId: string, id: string): Promise<ReceiptUrl> {
    const receipt = await this.prisma.paymentReceipt.findFirst({
      where: { orderId: id, order: { storeId } },
      select: { publicId: true, mimeType: true },
    });
    if (!receipt) throw notFound('Receipt');

    const ttl = this.config.receiptUrlTtlSeconds;
    return {
      url: this.storage.privateUrl(receipt.publicId, receipt.mimeType as PrivateFileFormat, ttl),
      expiresAt: new Date(Date.now() + ttl * 1000).toISOString(),
    };
  }

  /** Reserves stock for lines whose product still exists and is tracked; returns their item ids. */
  private async reserveAgain(
    tx: Db,
    storeId: string,
    items: { id: string; productId: string | null; quantity: number }[],
  ): Promise<string[]> {
    const productIds = items.flatMap((item) => (item.productId ? [item.productId] : []));
    const products = await tx.product.findMany({
      where: { storeId, id: { in: productIds }, trackStock: true },
      select: { id: true },
    });
    const tracked = new Set(products.map((product) => product.id));
    const lines = items.filter((item) => item.productId && tracked.has(item.productId));

    await this.stock.reserve(
      tx,
      storeId,
      lines.map((item) => ({
        productId: item.productId ?? '',
        quantity: item.quantity,
        trackStock: true,
      })),
    );
    return lines.map((item) => item.id);
  }
}

function invalidTransition(from: OrderStatus, to: OrderStatus): AppException {
  return new AppException(
    'INVALID_STATUS_TRANSITION',
    `An order cannot go from ${from} to ${to}`,
    HttpStatus.CONFLICT,
    { from, to },
  );
}
