import { describe, expect, it } from 'vitest';

import { createOrderSchema } from './order';

const base = {
  items: [{ productId: 'p1', quantity: 2 }],
  fulfillment: 'PICKUP',
  payment: { type: 'CASH' },
  customer: { name: 'Ana', phone: '+50688887777' },
  privacyConsent: true,
};

describe('createOrderSchema', () => {
  it('accepts a pickup order without prices', () => {
    expect(createOrderSchema.safeParse(base).success).toBe(true);
  });

  it('ignores any client-sent price or total', () => {
    const parsed = createOrderSchema.parse({
      ...base,
      totalMinor: 1,
      items: [{ productId: 'p1', quantity: 2, unitPriceMinor: 1 }],
    });
    expect(parsed).not.toHaveProperty('totalMinor');
    expect(parsed.items[0]).toEqual({ productId: 'p1', quantity: 2 });
  });

  it('requires privacy consent', () => {
    expect(createOrderSchema.safeParse({ ...base, privacyConsent: false }).success).toBe(false);
  });

  it('requires a zone and an address for delivery', () => {
    const result = createOrderSchema.safeParse({ ...base, fulfillment: 'DELIVERY' });
    expect(result.success).toBe(false);
    expect(result.error?.issues.map((issue) => issue.path.join('.'))).toEqual([
      'deliveryZoneId',
      'deliveryAddress',
    ]);
  });

  it.each([
    ['a zero quantity', { items: [{ productId: 'p1', quantity: 0 }] }],
    [
      'a duplicated product',
      {
        items: [
          { productId: 'p1', quantity: 1 },
          { productId: 'p1', quantity: 1 },
        ],
      },
    ],
    ['an empty cart', { items: [] }],
    ['a transfer without method', { payment: { type: 'TRANSFER' } }],
  ])('rejects %s', (_case, override) => {
    expect(createOrderSchema.safeParse({ ...base, ...override }).success).toBe(false);
  });
});
