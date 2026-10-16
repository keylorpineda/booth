import { z } from 'zod';

import { quoteRequestSchema } from './quote';
import { orderStatusSchema } from './status';
import { appLocaleSchema } from '../countries/locale-schema';
import { e164PhoneSchema } from '../phone/phone';

export const paymentChoiceSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('CASH') }),
  z.object({ type: z.literal('TRANSFER'), methodId: z.string().min(1) }),
]);

export type PaymentChoice = z.infer<typeof paymentChoiceSchema>;

export const createOrderSchema = quoteRequestSchema
  .extend({
    deliveryAddress: z.string().trim().max(300).nullish(),
    payment: paymentChoiceSchema,
    customer: z.object({
      name: z.string().trim().min(1).max(80),
      phone: e164PhoneSchema,
      note: z.string().trim().max(300).nullish(),
    }),
    /** Consent to the store's privacy notice; required before storing name and phone. */
    privacyConsent: z.literal(true, { error: 'Privacy consent is required' }),
    /** Language of the customer's UI (the WhatsApp message uses the store language). */
    locale: appLocaleSchema.optional(),
  })
  .superRefine((order, ctx) => {
    if (order.fulfillment !== 'DELIVERY') return;
    if (!order.deliveryZoneId) {
      ctx.addIssue({ code: 'custom', path: ['deliveryZoneId'], message: 'Choose a delivery zone' });
    }
    if (!order.deliveryAddress || order.deliveryAddress.length < 5) {
      ctx.addIssue({ code: 'custom', path: ['deliveryAddress'], message: 'Enter the address' });
    }
  });

export type CreateOrderInput = z.infer<typeof createOrderSchema>;

export const orderCreatedSchema = z.object({
  code: z.string(),
  trackingToken: z.string(),
  trackingUrl: z.string(),
  status: orderStatusSchema,
  currency: z.string(),
  subtotalMinor: z.number().int(),
  deliveryFeeMinor: z.number().int(),
  totalMinor: z.number().int(),
  expiresAt: z.string().nullable(),
  /** `https://wa.me/<store phone>?text=<message>`: the order is already saved as PENDING. */
  whatsappUrl: z.string(),
});

export type OrderCreated = z.infer<typeof orderCreatedSchema>;
