import { describe, expect, it } from 'vitest';

import { type OwnerOrderSummary } from '@booth/shared';

import { orderAlerts, snapshotOf } from './order-alerts';

const order = (id: string, paymentStatus: OwnerOrderSummary['paymentStatus'] = 'UNPAID') =>
  ({ id, code: id.toUpperCase(), paymentStatus }) as OwnerOrderSummary;

describe('orderAlerts', () => {
  it('stays silent on the first check', () => {
    expect(orderAlerts(null, [order('a'), order('b')])).toEqual([]);
  });

  it('reports orders that were not there before', () => {
    const previous = snapshotOf([order('a')]);
    const alerts = orderAlerts(previous, [order('b'), order('a')]);
    expect(alerts.map((alert) => [alert.kind, alert.order.id])).toEqual([['newOrder', 'b']]);
  });

  it('reports a receipt once, when it arrives', () => {
    const previous = snapshotOf([order('a')]);
    const now = [order('a', 'RECEIPT_SUBMITTED')];
    expect(orderAlerts(previous, now).map((alert) => alert.kind)).toEqual(['receipt']);
    expect(orderAlerts(snapshotOf(now), now)).toEqual([]);
  });

  it('ignores payments the owner confirmed and orders that left the list', () => {
    const previous = snapshotOf([order('a', 'RECEIPT_SUBMITTED'), order('b')]);
    expect(orderAlerts(previous, [order('a', 'PAID')])).toEqual([]);
  });
});
