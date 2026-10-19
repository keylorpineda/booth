import { describe, expect, it } from 'vitest';

import { productBadges } from './product-status';

describe('productBadges', () => {
  it('flags hidden, sold out and low stock products', () => {
    expect(productBadges({ isActive: false, trackStock: false, stock: 0 })).toEqual(['inactive']);
    expect(productBadges({ isActive: true, trackStock: true, stock: 0 })).toEqual(['soldOut']);
    expect(productBadges({ isActive: true, trackStock: true, stock: 5 })).toEqual(['lowStock']);
    expect(productBadges({ isActive: false, trackStock: true, stock: 2 })).toEqual([
      'inactive',
      'lowStock',
    ]);
  });

  it('never shows made-to-order products as sold out', () => {
    expect(productBadges({ isActive: true, trackStock: false, stock: 0 })).toEqual([]);
    expect(productBadges({ isActive: true, trackStock: true, stock: 6 })).toEqual([]);
  });
});
