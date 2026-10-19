import { type OwnerOrderSummary } from '@booth/shared';

export type OrderAlert =
  { kind: 'newOrder'; order: OwnerOrderSummary } | { kind: 'receipt'; order: OwnerOrderSummary };

/** What the previous check saw: payment status by order id. `null` = nothing checked yet. */
export type OrderSnapshot = ReadonlyMap<string, OwnerOrderSummary['paymentStatus']> | null;

export function snapshotOf(orders: readonly OwnerOrderSummary[]): OrderSnapshot {
  return new Map(orders.map((order) => [order.id, order.paymentStatus]));
}

/**
 * Changes worth telling the owner about since the previous check: orders that were not there
 * before, and receipts that arrived. The first check only sets the baseline (no alerts).
 */
export function orderAlerts(
  previous: OrderSnapshot,
  current: readonly OwnerOrderSummary[],
): OrderAlert[] {
  if (!previous) return [];
  const alerts: OrderAlert[] = [];
  for (const order of current) {
    const before = previous.get(order.id);
    if (before === undefined) {
      alerts.push({ kind: 'newOrder', order });
    } else if (order.paymentStatus === 'RECEIPT_SUBMITTED' && before !== 'RECEIPT_SUBMITTED') {
      alerts.push({ kind: 'receipt', order });
    }
  }
  return alerts;
}
