import { describe, expect, it } from 'vitest';

import { paymentChoices, type PublicTransferMethod } from './payment-choices';

const method = (id: string, label: string, preset: string | null): PublicTransferMethod => ({
  id,
  label,
  preset,
  accountHolder: null,
  accountIdentifier: null,
  instructions: null,
  paymentUrl: null,
});

describe('paymentChoices', () => {
  it('shows one option per preset, keeping the first in the owner order', () => {
    const choices = paymentChoices([
      method('a', 'SINPE Móvil', 'SINPE_MOVIL'),
      method('b', 'SINPE Móvil', 'SINPE_MOVIL'),
      method('c', 'Transferencia bancaria (IBAN)', 'IBAN_CR'),
    ]);
    expect(choices.map((choice) => choice.id)).toEqual(['a', 'c']);
  });

  it('merges custom methods with the same name, ignoring case and spaces', () => {
    const choices = paymentChoices([
      method('a', 'Banco Nacional', null),
      method('b', ' banco nacional ', null),
      method('c', 'PayPal', null),
    ]);
    expect(choices.map((choice) => choice.id)).toEqual(['a', 'c']);
  });
});
