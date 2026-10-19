import { describe, expect, it } from 'vitest';

import { emptyProductForm, productFormSchema, toProductInput } from './product-form';

const form = (overrides = {}) => ({ ...emptyProductForm(null), name: 'Pan de ajo', ...overrides });

describe('product form', () => {
  it('saves a CRC price typed as 2500 as 250000 minor units', () => {
    const values = productFormSchema('CRC').parse(form({ price: '2500' }));
    expect(toProductInput(values, 'CRC')).toMatchObject({ priceMinor: 250_000 });
  });

  it('rejects decimals a currency does not have', () => {
    const result = productFormSchema('JPY').safeParse(form({ price: '10.5' }));
    expect(result.error?.issues[0]).toMatchObject({
      path: ['price'],
      message: 'validation.amountDecimals',
    });
  });

  it('requires a whole stock only when stock is tracked', () => {
    expect(productFormSchema('USD').safeParse(form({ price: '5', stock: 'x' })).success).toBe(true);
    const tracked = productFormSchema('USD').safeParse(
      form({ price: '5', trackStock: true, stock: '2.5' }),
    );
    expect(tracked.error?.issues[0]?.path).toEqual(['stock']);
  });

  it('sends nulls for an empty description and no category, and 0 stock when untracked', () => {
    const values = productFormSchema('USD').parse(form({ price: '5', stock: '9' }));
    expect(toProductInput(values, 'USD')).toEqual({
      name: 'Pan de ajo',
      description: null,
      priceMinor: 500,
      categoryId: null,
      isActive: true,
      trackStock: false,
      stock: 0,
    });
  });
});
