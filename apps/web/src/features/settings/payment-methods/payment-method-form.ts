import { z } from 'zod';

import {
  type CreatePaymentMethodInput,
  findPreset,
  PAYMENT_PRESET_IDS,
  type PaymentMethod,
  resolveAppLocale,
} from '@booth/shared';

function isHttpsUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'https:' && parsed.hostname.includes('.');
  } catch {
    return false;
  }
}

export const paymentMethodFormSchema = z
  .object({
    preset: z
      .string()
      .refine((id) => id === '' || PAYMENT_PRESET_IDS.includes(id), 'validation.invalid')
      .transform((id) => (id === '' ? null : id)),
    label: z.string().trim().min(1, 'validation.required').max(60, 'validation.tooLong'),
    accountHolder: z.string().trim().max(80, 'validation.tooLong'),
    accountIdentifier: z.string().trim().max(120, 'validation.tooLong'),
    instructions: z.string().trim().max(500, 'validation.tooLong'),
    paymentUrl: z.string().trim().max(500, 'validation.tooLong'),
  })
  .superRefine((form, ctx) => {
    if (form.paymentUrl !== '' && !isHttpsUrl(form.paymentUrl)) {
      ctx.addIssue({ code: 'custom', path: ['paymentUrl'], message: 'validation.httpsUrl' });
    }
  });

export type PaymentMethodFormInput = z.input<typeof paymentMethodFormSchema>;
export type PaymentMethodForm = z.output<typeof paymentMethodFormSchema>;

/** Pre-fills the form from a country preset (or clears to custom when `presetId` is empty). */
export function emptyPaymentMethodForm(presetId: string, locale: string): PaymentMethodFormInput {
  const preset = findPreset(presetId);
  const lang = resolveAppLocale(locale);
  return {
    preset: preset?.id ?? '',
    label: preset?.label ?? '',
    accountHolder: '',
    accountIdentifier: '',
    instructions: preset?.instructions[lang] ?? '',
    paymentUrl: '',
  };
}

export function toPaymentMethodForm(method: PaymentMethod): PaymentMethodFormInput {
  return {
    preset: method.preset ?? '',
    label: method.label,
    accountHolder: method.accountHolder ?? '',
    accountIdentifier: method.accountIdentifier ?? '',
    instructions: method.instructions ?? '',
    paymentUrl: method.paymentUrl ?? '',
  };
}

export function toPaymentMethodInput(
  form: PaymentMethodForm,
  isActive = true,
): CreatePaymentMethodInput {
  const nullIfEmpty = (value: string) => (value === '' ? null : value);
  return {
    preset: form.preset,
    label: form.label,
    accountHolder: nullIfEmpty(form.accountHolder),
    accountIdentifier: nullIfEmpty(form.accountIdentifier),
    instructions: nullIfEmpty(form.instructions),
    paymentUrl: nullIfEmpty(form.paymentUrl),
    isActive,
  };
}
