import { describe, expect, it } from 'vitest';

import { createPaymentMethodSchema } from './payment-method';
import { findPreset, PAYMENT_PRESETS, presetsForCountry } from './presets';

describe('payment presets', () => {
  it('suggests local methods first, then the ones that work anywhere', () => {
    expect(presetsForCountry('CR').map((p) => p.id)).toEqual(['SINPE_MOVIL', 'IBAN_CR', 'PAYPAL']);
    expect(presetsForCountry('US').map((p) => p.id)).toEqual([
      'ZELLE',
      'VENMO',
      'CASH_APP',
      'PAYPAL',
    ]);
    expect(presetsForCountry('JP').map((p) => p.id)).toEqual(['PAYPAL']);
  });

  it('has unique ids and copy in both languages', () => {
    expect(new Set(PAYMENT_PRESETS.map((p) => p.id)).size).toBe(PAYMENT_PRESETS.length);
    for (const preset of PAYMENT_PRESETS) {
      expect(preset.identifier.es && preset.identifier.en).toBeTruthy();
      expect(preset.instructions.es && preset.instructions.en).toBeTruthy();
    }
  });

  it('finds presets by id', () => {
    expect(findPreset('YAPE')?.label).toBe('Yape');
    expect(findPreset(null)).toBeUndefined();
  });
});

describe('createPaymentMethodSchema', () => {
  it('fills defaults for a custom method', () => {
    expect(createPaymentMethodSchema.parse({ label: 'Transferencia' })).toEqual({
      label: 'Transferencia',
      preset: null,
      accountHolder: null,
      accountIdentifier: null,
      instructions: null,
      paymentUrl: null,
      isActive: true,
    });
  });

  it.each([
    ['an unknown preset', { label: 'X', preset: 'BITCOIN' }],
    ['a plain http link', { label: 'X', paymentUrl: 'http://paypal.me/shop' }],
    ['a javascript: link', { label: 'X', paymentUrl: 'javascript:alert(1)' }],
  ])('rejects %s', (_case, input) => {
    expect(createPaymentMethodSchema.safeParse(input).success).toBe(false);
  });

  it('accepts an https payment link', () => {
    const result = createPaymentMethodSchema.safeParse({
      label: 'PayPal',
      preset: 'PAYPAL',
      paymentUrl: 'https://paypal.me/booth',
    });
    expect(result.success).toBe(true);
  });
});
