import { describe, expect, it } from 'vitest';

import { presetsForCountry } from '@booth/shared';

import {
  emptyPaymentMethodForm,
  paymentMethodFormSchema,
  toPaymentMethodInput,
} from './payment-method-form';

describe('paymentMethodFormSchema & presets', () => {
  it('lists SINPE Móvil and IBAN first for CR, with PayPal available', () => {
    const ids = presetsForCountry('CR').map((preset) => preset.id);
    expect(ids).toEqual(['SINPE_MOVIL', 'IBAN_CR', 'PAYPAL']);
  });

  it('lists Zelle, Venmo and Cash App first for US', () => {
    const ids = presetsForCountry('US').map((preset) => preset.id);
    expect(ids).toEqual(['ZELLE', 'VENMO', 'CASH_APP', 'PAYPAL']);
  });

  it('pre-fills label and localized instructions from a preset', () => {
    expect(emptyPaymentMethodForm('SINPE_MOVIL', 'es-CR')).toMatchObject({
      preset: 'SINPE_MOVIL',
      label: 'SINPE Móvil',
      instructions: expect.stringContaining('SINPE Móvil'),
    });
  });

  it('rejects non-https payment links and accepts https links or empty', () => {
    const httpLink = paymentMethodFormSchema.safeParse({
      preset: 'PAYPAL',
      label: 'PayPal',
      accountHolder: '',
      accountIdentifier: '',
      instructions: '',
      paymentUrl: 'http://paypal.me/booth',
    });
    expect(httpLink.success).toBe(false);
    expect(httpLink.error?.issues[0]).toMatchObject({
      path: ['paymentUrl'],
      message: 'validation.httpsUrl',
    });

    const valid = paymentMethodFormSchema.parse({
      preset: 'PAYPAL',
      label: 'PayPal',
      accountHolder: '  Ana Rojas ',
      accountIdentifier: '8888-7777',
      instructions: '',
      paymentUrl: 'https://paypal.me/booth',
    });
    expect(toPaymentMethodInput(valid)).toEqual({
      preset: 'PAYPAL',
      label: 'PayPal',
      accountHolder: 'Ana Rojas',
      accountIdentifier: '8888-7777',
      instructions: null,
      paymentUrl: 'https://paypal.me/booth',
      isActive: true,
    });
  });
});
