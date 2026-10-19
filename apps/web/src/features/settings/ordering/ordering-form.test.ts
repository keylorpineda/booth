import { describe, expect, it } from 'vitest';

import { orderingFormSchema, toOrderingUpdate } from './ordering-form';

describe('orderingFormSchema', () => {
  it('requires at least one of pickup or delivery to be enabled', () => {
    const result = orderingFormSchema.safeParse({
      acceptOrdersWhenClosed: false,
      orderExpirationMinutes: '30',
      pickupEnabled: false,
      pickupAddress: '',
      deliveryEnabled: false,
      cashEnabled: true,
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]).toMatchObject({
      path: ['pickupEnabled'],
      message: 'validation.fulfillmentRequired',
    });
  });

  it('validates expiration window bounds and converts empty pickup address to null', () => {
    const tooShort = orderingFormSchema.safeParse({
      acceptOrdersWhenClosed: false,
      orderExpirationMinutes: '3',
      pickupEnabled: true,
      pickupAddress: '',
      deliveryEnabled: true,
      cashEnabled: true,
    });
    expect(tooShort.success).toBe(false);
    expect(tooShort.error?.issues[0]?.message).toBe('validation.expirationMinutes');

    const parsed = orderingFormSchema.parse({
      acceptOrdersWhenClosed: true,
      orderExpirationMinutes: '45',
      pickupEnabled: true,
      pickupAddress: '   ',
      deliveryEnabled: false,
      cashEnabled: false,
    });
    expect(toOrderingUpdate(parsed)).toEqual({
      acceptOrdersWhenClosed: true,
      orderExpirationMinutes: 45,
      pickupEnabled: true,
      pickupAddress: null,
      deliveryEnabled: false,
      cashEnabled: false,
    });
  });
});
