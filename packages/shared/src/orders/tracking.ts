import { z } from 'zod';

import { quoteLineSchema } from './quote';
import { fulfillmentSchema, orderStatusSchema, paymentStatusSchema } from './status';

/** Public order view reached with the unguessable tracking token. No customer phone. */
export const trackingSchema = z.object({
  code: z.string(),
  status: orderStatusSchema,
  paymentStatus: paymentStatusSchema,
  createdAt: z.string(),
  /** While PENDING and unpaid; null once paused by a receipt or no longer pending. */
  expiresAt: z.string().nullable(),
  store: z.object({
    slug: z.string(),
    name: z.string(),
    logoUrl: z.string().nullable(),
    brandColor: z.string(),
    brandForeground: z.string(),
    whatsappPhone: z.string(),
    locale: z.string(),
    country: z.string(),
  }),
  currency: z.string(),
  lines: z.array(quoteLineSchema.omit({ productId: true })),
  subtotalMinor: z.number().int(),
  deliveryFeeMinor: z.number().int(),
  totalMinor: z.number().int(),
  fulfillment: fulfillmentSchema,
  deliveryZoneName: z.string().nullable(),
  payment: z.object({
    kind: z.enum(['CASH', 'TRANSFER']),
    label: z.string(),
    /** Transfer details to pay with the order code as reference (null for cash). */
    accountHolder: z.string().nullable(),
    accountIdentifier: z.string().nullable(),
    instructions: z.string().nullable(),
    paymentUrl: z.string().nullable(),
  }),
  timeline: z.array(z.object({ status: orderStatusSchema, at: z.string() })),
  receipt: z.object({ uploadedAt: z.string() }).nullable(),
  canUploadReceipt: z.boolean(),
});

export type Tracking = z.infer<typeof trackingSchema>;

export const RECEIPT_MAX_BYTES = 5 * 1024 * 1024;
