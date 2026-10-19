import { ORDER_TRANSITIONS, type OrderStatus, type OwnerOrder } from '@booth/shared';

import { ApiError } from '../../lib/api-client';

/** Next steps for an order: forward moves first, cancel kept apart (it asks for confirmation). */
export function statusActions(status: OrderStatus): {
  forward: OrderStatus[];
  canCancel: boolean;
} {
  const next = ORDER_TRANSITIONS[status];
  return {
    forward: next.filter((target) => target !== 'CANCELLED'),
    canCancel: next.includes('CANCELLED'),
  };
}

/** Payment can change until the order is cancelled or expired (API rule). */
export function canChangePayment(order: Pick<OwnerOrder, 'status'>): boolean {
  return order.status !== 'CANCELLED' && order.status !== 'EXPIRED';
}

/** Names of the order lines that made a reactivation fail with OUT_OF_STOCK. */
export function soldOutItems(error: unknown, order: Pick<OwnerOrder, 'items'>): string[] {
  if (!(error instanceof ApiError) || error.code !== 'OUT_OF_STOCK') return [];
  const ids = error.details?.productIds;
  if (!Array.isArray(ids)) return [];
  return order.items
    .filter((item) => item.productId !== null && ids.includes(item.productId))
    .map((item) => item.name);
}
