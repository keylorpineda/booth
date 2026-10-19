import { describe, expect, it } from 'vitest';

import { reorderSchema } from './common';
import { createProductSchema, productListQuerySchema, updateProductSchema } from './product';

describe('createProductSchema', () => {
  it('applies defaults for an untracked, active product', () => {
    expect(createProductSchema.parse({ name: ' Pan ', priceMinor: 150000 })).toEqual({
      name: 'Pan',
      priceMinor: 150000,
      description: null,
      categoryId: null,
      trackStock: false,
      stock: 0,
      isActive: true,
    });
  });

  it.each([
    ['a float price', { name: 'Pan', priceMinor: 10.5 }],
    ['a negative price', { name: 'Pan', priceMinor: -1 }],
    ['negative stock', { name: 'Pan', priceMinor: 1, stock: -1 }],
    ['an empty name', { name: '  ', priceMinor: 1 }],
  ])('rejects %s', (_case, input) => {
    expect(createProductSchema.safeParse(input).success).toBe(false);
  });
});

describe('updateProductSchema', () => {
  it('accepts partial updates without injecting defaults', () => {
    expect(updateProductSchema.parse({ stock: 5 })).toEqual({ stock: 5 });
  });
});

describe('reorderSchema', () => {
  it('rejects duplicate ids', () => {
    expect(reorderSchema.safeParse({ ids: ['a', 'b', 'a'] }).success).toBe(false);
    expect(reorderSchema.safeParse({ ids: ['a', 'b'] }).success).toBe(true);
  });
});

describe('productListQuerySchema', () => {
  it('coerces the limit from the query string with a default', () => {
    expect(productListQuerySchema.parse({ limit: '20' }).limit).toBe(20);
    expect(productListQuerySchema.parse({}).limit).toBe(50);
    expect(productListQuerySchema.safeParse({ limit: '500' }).success).toBe(false);
  });
});
