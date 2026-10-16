import { z } from 'zod';

import { type CreateOrderInput, fulfillmentSchema, toE164 } from '@booth/shared';

import { type CartLine } from '../cart/use-cart';

export const CASH = 'cash';

/** Form-shaped schema (plain strings for inputs). Messages are i18n keys. */
export function checkoutFormSchema(country: string) {
  return z
    .object({
      name: z.string().trim().min(1, 'validation.required').max(80, 'validation.tooLong'),
      phone: z.string().trim().min(1, 'validation.required'),
      note: z.string().trim().max(300, 'validation.tooLong'),
      fulfillment: fulfillmentSchema,
      deliveryZoneId: z.string(),
      deliveryAddress: z.string().trim().max(300, 'validation.tooLong'),
      /** `cash` or a transfer method id. */
      payment: z.string().min(1, 'validation.choosePayment'),
      privacyConsent: z.boolean().refine(Boolean, 'validation.consent'),
    })
    .superRefine((form, ctx) => {
      if (!toE164(form.phone, country)) {
        ctx.addIssue({ code: 'custom', path: ['phone'], message: 'validation.phone' });
      }
      if (form.fulfillment !== 'DELIVERY') return;
      if (!form.deliveryZoneId) {
        ctx.addIssue({
          code: 'custom',
          path: ['deliveryZoneId'],
          message: 'validation.chooseZone',
        });
      }
      if (form.deliveryAddress.length < 5) {
        ctx.addIssue({ code: 'custom', path: ['deliveryAddress'], message: 'validation.address' });
      }
    });
}

export type CheckoutForm = z.infer<ReturnType<typeof checkoutFormSchema>>;

/** Builds the API body. Only ids and quantities leave the browser, never prices. */
export function toOrderInput(
  form: CheckoutForm,
  lines: readonly CartLine[],
  country: string,
  locale: string,
): CreateOrderInput {
  const delivery = form.fulfillment === 'DELIVERY';
  return {
    items: lines.map((line) => ({ productId: line.product.id, quantity: line.quantity })),
    fulfillment: form.fulfillment,
    deliveryZoneId: delivery ? form.deliveryZoneId : null,
    deliveryAddress: delivery ? form.deliveryAddress : null,
    payment:
      form.payment === CASH ? { type: 'CASH' } : { type: 'TRANSFER', methodId: form.payment },
    customer: {
      name: form.name,
      phone: toE164(form.phone, country) ?? form.phone,
      note: form.note || null,
    },
    privacyConsent: true,
    locale: locale.startsWith('en') ? 'en' : 'es',
  };
}
