import { describe, expect, it } from 'vitest';

import { type PublicProduct } from '@booth/shared';

import { CASH, type CheckoutForm, checkoutFormSchema, toOrderInput } from './checkout-form';

const valid: CheckoutForm = {
  name: 'Ana',
  phone: '8888 7777',
  note: '',
  fulfillment: 'PICKUP',
  deliveryZoneId: '',
  deliveryAddress: '',
  payment: CASH,
  privacyConsent: true,
};

const product = { id: 'p1', priceMinor: 250000 } as PublicProduct;

describe('checkoutFormSchema', () => {
  const schema = checkoutFormSchema('CR');
  const errors = (form: Partial<CheckoutForm>) =>
    schema
      .safeParse({ ...valid, ...form })
      .error?.issues.map((issue) => [issue.path.join('.'), issue.message]);

  it('accepts a local phone number for the store country', () => {
    expect(schema.safeParse(valid).success).toBe(true);
  });

  it('reports translated message keys', () => {
    expect(errors({ name: '', phone: '123', privacyConsent: false })).toEqual([
      ['name', 'validation.required'],
      ['privacyConsent', 'validation.consent'],
      ['phone', 'validation.phone'],
    ]);
  });

  it('requires a zone and an address for delivery', () => {
    expect(errors({ fulfillment: 'DELIVERY' })).toEqual([
      ['deliveryZoneId', 'validation.chooseZone'],
      ['deliveryAddress', 'validation.address'],
    ]);
  });
});

describe('toOrderInput', () => {
  it('sends ids, quantities and an E.164 phone, never prices', () => {
    const input = toOrderInput(
      valid,
      [{ product, quantity: 2, lineTotalMinor: 500000 }],
      'CR',
      'es',
    );

    expect(input).toEqual({
      items: [{ productId: 'p1', quantity: 2 }],
      fulfillment: 'PICKUP',
      deliveryZoneId: null,
      deliveryAddress: null,
      payment: { type: 'CASH' },
      customer: { name: 'Ana', phone: '+50688887777', note: null },
      privacyConsent: true,
      locale: 'es',
    });
    expect(JSON.stringify(input)).not.toContain('250000');
  });

  it('maps a transfer method and delivery details', () => {
    const input = toOrderInput(
      {
        ...valid,
        fulfillment: 'DELIVERY',
        deliveryZoneId: 'z1',
        deliveryAddress: 'Casa azul',
        payment: 'm1',
      },
      [],
      'CR',
      'en',
    );

    expect(input).toMatchObject({
      deliveryZoneId: 'z1',
      deliveryAddress: 'Casa azul',
      payment: { type: 'TRANSFER', methodId: 'm1' },
      locale: 'en',
    });
  });
});
