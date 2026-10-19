import { z } from 'zod';

import { MAX_ITEM_QUANTITY, MAX_ORDER_LINES } from './limits';
import { fulfillmentSchema } from './status';

/** The client sends product ids and quantities only. The server computes every price. */
export const cartItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().min(1).max(MAX_ITEM_QUANTITY),
});

export const cartItemsSchema = z
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
