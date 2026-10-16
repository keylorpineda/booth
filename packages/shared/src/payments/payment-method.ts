import { z } from 'zod';

import { PAYMENT_PRESET_IDS } from './presets';

const optionalText = (max: number) => z.string().trim().max(max).nullable();

const paymentMethodFields = z.object({
  /** Known preset id, or null for a custom method. */
  preset: z
    .string()
    .refine((id) => PAYMENT_PRESET_IDS.includes(id), 'Unknown preset')
    .nullable(),
  label: z.string().trim().min(1).max(60),
  accountHolder: optionalText(80),
  accountIdentifier: optionalText(120),
  instructions: optionalText(500),
  /** Optional payment link (PayPal.me, Stripe Payment Link, ...): https only. */
  paymentUrl: z
    .url({ protocol: /^https$/, error: 'Use an https:// link' })
    .max(500)
    .nullable(),
  isActive: z.boolean(),
});

export const createPaymentMethodSchema = paymentMethodFields.extend({
  preset: paymentMethodFields.shape.preset.default(null),
  accountHolder: paymentMethodFields.shape.accountHolder.default(null),
  accountIdentifier: paymentMethodFields.shape.accountIdentifier.default(null),
  instructions: paymentMethodFields.shape.instructions.default(null),
  paymentUrl: paymentMethodFields.shape.paymentUrl.default(null),
  isActive: z.boolean().default(true),
});

export const updatePaymentMethodSchema = paymentMethodFields.partial();

export type CreatePaymentMethodInput = z.infer<typeof createPaymentMethodSchema>;
export type UpdatePaymentMethodInput = z.infer<typeof updatePaymentMethodSchema>;

export const paymentMethodSchema = z.object({
  id: z.string(),
  preset: z.string().nullable(),
  label: z.string(),
  accountHolder: z.string().nullable(),
  accountIdentifier: z.string().nullable(),
  instructions: z.string().nullable(),
  paymentUrl: z.string().nullable(),
  isActive: z.boolean(),
  position: z.number().int(),
});

export type PaymentMethod = z.infer<typeof paymentMethodSchema>;
