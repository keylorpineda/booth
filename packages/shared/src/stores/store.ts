import { z } from 'zod';

import { appLocaleSchema, countryCodeSchema, timeZoneSchema } from '../countries';
import { currencyCodeSchema } from '../money';
import { e164PhoneSchema } from '../phone';
import { slugSchema } from './slug';

/**
 * Onboarding: only name, slug and WhatsApp phone are required. Localization fields default to the
 * country profile (Costa Rica when no country is given) on the server.
 */
export const createStoreSchema = z.object({
  name: z.string().trim().min(2).max(80),
  slug: slugSchema,
  whatsappPhone: e164PhoneSchema,
  country: countryCodeSchema.optional(),
  currency: currencyCodeSchema.optional(),
  timezone: timeZoneSchema.optional(),
  locale: appLocaleSchema.optional(),
});

export type CreateStoreInput = z.infer<typeof createStoreSchema>;

export const slugAvailabilityQuerySchema = z.object({ slug: z.string() });

export const slugAvailabilitySchema = z.object({
  slug: z.string(),
  available: z.boolean(),
  /** Why the slug cannot be used, when not available. */
  reason: z.enum(['invalid', 'reserved', 'taken']).optional(),
});

export type SlugAvailability = z.infer<typeof slugAvailabilitySchema>;

/** Owner view of the store settings (grows with each phase). */
export const storeSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  whatsappPhone: z.string(),
  brandColor: z.string(),
  country: z.string(),
  currency: z.string(),
  timezone: z.string(),
  locale: z.string(),
  acceptOrdersWhenClosed: z.boolean(),
  orderExpirationMinutes: z.number().int(),
  pickupEnabled: z.boolean(),
  deliveryEnabled: z.boolean(),
  cashEnabled: z.boolean(),
  pricesNote: z.string().nullable(),
  isActive: z.boolean(),
  createdAt: z.string(),
});

export type Store = z.infer<typeof storeSchema>;
