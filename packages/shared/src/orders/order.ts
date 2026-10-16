import { z } from 'zod';

import { appLocaleSchema } from '../countries';
import { e164PhoneSchema } from '../phone';

export const ORDER_STATUSES = [
  'PENDING',
  'CONFIRMED',
  'PREPARING',
  'READY',
  'COMPLETED',
  'CANCELLED',
  'EXPIRED',
] as const;
export const orderStatusSchema = z.enum(ORDER_STATUSES);
export type OrderStatus = z.infer<typeof orderStatusSchema>;

export const paymentStatusSchema = z.enum(['UNPAID', 'RECEIPT_SUBMITTED', 'PAID']);
export type PaymentStatus = z.infer<typeof paymentStatusSchema>;

export const fulfillmentSchema = z.enum(['PICKUP', 'DELIVERY']);
export type Fulfillment = z.infer<typeof fulfillmentSchema>;

export const MAX_ITEM_QUANTITY = 99;
export const MAX_ORDER_LINES = 50;

/** The client sends product ids and quantities only. The server computes every price. */
export const cartItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().min(1).max(MAX_ITEM_QUANTITY),
});

const cartItemsSchema = z
  .array(cartItemSchema)
  .min(1)
  .max(MAX_ORDER_LINES)
  .refine(
    (items) => new Set(items.map((item) => item.productId)).size === items.length,
    'Each product can appear only once',
  );

export const quoteRequestSchema = z.object({
  items: cartItemsSchema,
  fulfillment: fulfillmentSchema,
  deliveryZoneId: z.string().min(1).nullish(),
});

export type QuoteRequest = z.infer<typeof quoteRequestSchema>;

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

export const quoteLineSchema = z.object({
  productId: z.string(),
  name: z.string(),
  unitPriceMinor: z.number().int(),
  quantity: z.number().int(),
  lineTotalMinor: z.number().int(),
});

export const quoteSchema = z.object({
  currency: z.string(),
  lines: z.array(quoteLineSchema),
  subtotalMinor: z.number().int(),
  deliveryFeeMinor: z.number().int(),
  totalMinor: z.number().int(),
});

export type Quote = z.infer<typeof quoteSchema>;

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
