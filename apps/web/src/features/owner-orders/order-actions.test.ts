import { describe, expect, it } from 'vitest';

import { canChangePayment, soldOutItems, statusActions } from './order-actions';
import { ApiError } from '../../lib/api-client';

describe('statusActions', () => {
  it('offers only "complete" and "cancel" for a ready order', () => {
    expect(statusActions('READY')).toEqual({ forward: ['COMPLETED'], canCancel: true });
  });

  it('offers confirm for a pending order and nothing for finished ones', () => {
    expect(statusActions('PENDING')).toEqual({ forward: ['CONFIRMED'], canCancel: true });
    for (const status of ['COMPLETED', 'CANCELLED', 'EXPIRED'] as const) {
      expect(statusActions(status)).toEqual({ forward: [], canCancel: false });
    }
  });
});

describe('canChangePayment', () => {
  it('is closed for cancelled and expired orders', () => {
    expect(canChangePayment({ status: 'READY' })).toBe(true);
    expect(canChangePayment({ status: 'CANCELLED' })).toBe(false);
    expect(canChangePayment({ status: 'EXPIRED' })).toBe(false);
  });
});

describe('soldOutItems', () => {
  const order = {
    items: [
      {
        id: 'i1',
        productId: 'p1',
        name: 'Croissant',
        unitPriceMinor: 1,
        quantity: 1,
        lineTotalMinor: 1,
      },
      {
        id: 'i2',
        productId: 'p2',
        name: 'Baguette',
        unitPriceMinor: 1,
        quantity: 1,
        lineTotalMinor: 1,
      },
      {
        id: 'i3',
        productId: null,
        name: 'Deleted',
        unitPriceMinor: 1,
        quantity: 1,
        lineTotalMinor: 1,
      },
    ],
  };

  it('names the lines whose products ran out', () => {
    const error = new ApiError(409, 'OUT_OF_STOCK', 'x', { productIds: ['p2'] });
    expect(soldOutItems(error, order)).toEqual(['Baguette']);
  });

  it('ignores other errors', () => {
    expect(soldOutItems(new ApiError(409, 'INVALID_STATUS_TRANSITION', 'x'), order)).toEqual([]);
    expect(soldOutItems(new Error('boom'), order)).toEqual([]);
  });
});
