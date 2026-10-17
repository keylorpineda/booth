import { z } from 'zod';

import { type CreateDeliveryZoneInput, type DeliveryZone } from '@booth/shared';

import { formatMoneyInput, parseMoneyInput } from '../../../lib/money-input';

export function zoneFormSchema(currency: string) {
  return z
    .object({
      name: z.string().trim().min(1, 'validation.required').max(60, 'validation.tooLong'),
      fee: z.string(),
    })
    .superRefine((form, ctx) => {
      const fee = parseMoneyInput(form.fee, currency);
      if (!fee.ok) {
        const message = {
          empty: 'validation.required',
          invalid: 'validation.amount',
          decimals: 'validation.amountDecimals',
        }[fee.reason];
        ctx.addIssue({ code: 'custom', path: ['fee'], message });
      }
    });
}

export type ZoneForm = z.infer<ReturnType<typeof zoneFormSchema>>;

export function toZoneForm(zone: DeliveryZone, currency: string, locale: string): ZoneForm {
  return {
    name: zone.name,
    fee: formatMoneyInput(zone.feeMinor, currency, locale),
  };
}

export function toZoneInput(
  form: ZoneForm,
  currency: string,
  isActive = true,
): CreateDeliveryZoneInput {
  const fee = parseMoneyInput(form.fee, currency);
  if (!fee.ok) throw new Error('Fee must be validated before submitting');
  return {
    name: form.name,
    feeMinor: fee.minor,
    isActive,
  };
}
