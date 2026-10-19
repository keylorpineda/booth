import { z } from 'zod';

import { fulfillmentSchema, orderStatusSchema, paymentStatusSchema } from './status';
import {
  receiptVerificationResultSchema,
  receiptVerificationStatusSchema,
} from '../receipts/schema';

/** `status` accepts a comma-separated list (`?status=PENDING,CONFIRMED`). */
export const ownerOrderListQuerySchema = z.object({
  status: z
    .string()
    .transform((value) => value.split(',').filter(Boolean))
    .pipe(z.array(orderStatusSchema))
    .optional(),
  paymentStatus: paymentStatusSchema.optional(),
  /** Inclusive range on the creation date (ISO dates or date-times). */
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  /** Matches the order code, customer name or phone. */
  q: z.string().trim().max(80).optional(),
  cursor: z.string().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(25),
});

export type OwnerOrderListQuery = z.infer<typeof ownerOrderListQuerySchema>;

export const ownerOrderSummarySchema = z.object({
  id: z.string(),
  code: z.string(),
  status: orderStatusSchema,
  paymentStatus: paymentStatusSchema,
  customerName: z.string(),
  customerPhone: z.string(),
  fulfillment: fulfillmentSchema,
  paymentMethodKind: z.enum(['CASH', 'TRANSFER']),
  paymentMethodLabel: z.string(),
  currency: z.string(),
  totalMinor: z.number().int(),
  itemCount: z.number().int(),
  hasReceipt: z.boolean(),
  receiptVerificationStatus: receiptVerificationStatusSchema.nullable().optional(),
  expiresAt: z.string().nullable(),
  createdAt: z.string(),
});

export type OwnerOrderSummary = z.infer<typeof ownerOrderSummarySchema>;

export const ownerOrderSchema = ownerOrderSummarySchema.extend({
  customerNote: z.string().nullable(),
  deliveryZoneName: z.string().nullable(),
  deliveryAddress: z.string().nullable(),
  subtotalMinor: z.number().int(),
  deliveryFeeMinor: z.number().int(),
  items: z.array(
    z.object({
      id: z.string(),
      productId: z.string().nullable(),
      name: z.string(),
      unitPriceMinor: z.number().int(),
      quantity: z.number().int(),
      lineTotalMinor: z.number().int(),
    }),
  ),
  events: z.array(
    z.object({
      status: orderStatusSchema,
      actor: z.string(),
      note: z.string().nullable(),
      at: z.string(),
    }),
  ),
  receipt: z
    .object({
      mimeType: z.string(),
      bytes: z.number().int(),
      uploadedAt: z.string(),
      verification: receiptVerificationResultSchema.nullable().optional(),
    })
    .nullable(),
  trackingToken: z.string(),
  privacyConsentAt: z.string(),
});

export type OwnerOrder = z.infer<typeof ownerOrderSchema>;

export const updateOrderStatusSchema = z.object({
  status: orderStatusSchema,
  note: z.string().trim().max(300).optional(),
});

export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;

export const updatePaymentStatusSchema = z.object({
  /** Owners confirm payment (PAID) or undo a mistake (UNPAID). */
  paymentStatus: z.enum(['PAID', 'UNPAID']),
});

export type UpdatePaymentStatusInput = z.infer<typeof updatePaymentStatusSchema>;

export const receiptUrlSchema = z.object({ url: z.string(), expiresAt: z.string() });
export type ReceiptUrl = z.infer<typeof receiptUrlSchema>;
