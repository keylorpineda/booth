import { z } from 'zod';

import { productImageSchema } from '../catalog';
import { businessHourSchema } from '../hours';

export const publicTransferMethodSchema = z.object({
  id: z.string(),
  label: z.string(),
  preset: z.string().nullable(),
  accountHolder: z.string().nullable(),
  accountIdentifier: z.string().nullable(),
  instructions: z.string().nullable(),
  paymentUrl: z.string().nullable(),
});

/** Everything the storefront needs besides the catalog. */
export const publicStoreSchema = z.object({
  slug: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  whatsappPhone: z.string(),
  brandColor: z.string(),
  brandForeground: z.string(),
  logoUrl: z.string().nullable(),
  coverUrl: z.string().nullable(),
  country: z.string(),
  currency: z.string(),
  timezone: z.string(),
  locale: z.string(),
  pricesNote: z.string().nullable(),
  hours: z.array(businessHourSchema),
  openNow: z.boolean(),
  /** openNow, or the store accepts orders while closed. */
  acceptingOrders: z.boolean(),
  nextOpening: z.object({ weekday: z.number().int(), opensAtMin: z.number().int() }).nullable(),
  fulfillment: z.object({
    pickup: z.object({ enabled: z.boolean(), address: z.string().nullable() }),
    delivery: z.object({
      enabled: z.boolean(),
      zones: z.array(z.object({ id: z.string(), name: z.string(), feeMinor: z.number().int() })),
    }),
  }),
  payment: z.object({
    cash: z.boolean(),
    transfer: z.array(publicTransferMethodSchema),
  }),
  privacy: z.object({ notice: z.string(), version: z.number().int() }),
});

export type PublicStore = z.infer<typeof publicStoreSchema>;

export const publicProductSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  priceMinor: z.number().int(),
  images: z.array(productImageSchema),
  available: z.boolean(),
  /** Units left for tracked products; null when made to order. */
  stockLeft: z.number().int().nullable(),
});

export type PublicProduct = z.infer<typeof publicProductSchema>;

export const publicCatalogSchema = z.object({
  categories: z.array(
    z.object({ id: z.string(), name: z.string(), products: z.array(publicProductSchema) }),
  ),
  uncategorized: z.array(publicProductSchema),
});

export type PublicCatalog = z.infer<typeof publicCatalogSchema>;
