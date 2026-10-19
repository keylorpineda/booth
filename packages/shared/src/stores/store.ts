import { z } from 'zod';

import { appLocaleSchema, countryCodeSchema, timeZoneSchema } from '../countries';
import { currencyCodeSchema } from '../money';
import { e164PhoneSchema } from '../phone';
import { hexColorSchema } from './color';
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

export const MIN_ORDER_EXPIRATION_MINUTES = 5;
export const MAX_ORDER_EXPIRATION_MINUTES = 24 * 60;

/** Settings, branding, ordering options, localization and privacy, all editable by the owner. */
export const updateStoreSchema = z
  .object({
    name: z.string().trim().min(2).max(80),
    description: z.string().trim().max(500).nullable(),
    whatsappPhone: e164PhoneSchema,
    brandColor: hexColorSchema,
    /** Free text such as "Sales tax not included". The system never calculates taxes. */
    pricesNote: z.string().trim().max(160).nullable(),
    // Ordering
    acceptOrdersWhenClosed: z.boolean(),
    orderExpirationMinutes: z
      .number()
      .int()
      .min(MIN_ORDER_EXPIRATION_MINUTES)
      .max(MAX_ORDER_EXPIRATION_MINUTES),
    pickupEnabled: z.boolean(),
    pickupAddress: z.string().trim().max(200).nullable(),
    deliveryEnabled: z.boolean(),
    cashEnabled: z.boolean(),
    // Localization (currency only while the store has no products or orders)
    country: countryCodeSchema,
    currency: currencyCodeSchema,
    timezone: timeZoneSchema,
    locale: appLocaleSchema,
    /** null = the default notice for the store's country. Changing it bumps the version. */
    privacyNotice: z.string().trim().min(20).max(4000).nullable(),
  })
  .partial();

export type UpdateStoreInput = z.infer<typeof updateStoreSchema>;

export const storeImageKindSchema = z.enum(['logo', 'cover']);
export type StoreImageKind = z.infer<typeof storeImageKindSchema>;

/** Owner view of the store settings (grows with each phase). */
export const storeSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  whatsappPhone: z.string(),
  brandColor: z.string(),
  /** Text color to use on top of brandColor (WCAG AA). */
  brandForeground: z.string(),
  logoUrl: z.string().nullable(),
  coverUrl: z.string().nullable(),
  country: z.string(),
  currency: z.string(),
  timezone: z.string(),
  locale: z.string(),
  acceptOrdersWhenClosed: z.boolean(),
  orderExpirationMinutes: z.number().int(),
  pickupEnabled: z.boolean(),
  pickupAddress: z.string().nullable(),
  deliveryEnabled: z.boolean(),
  cashEnabled: z.boolean(),
  pricesNote: z.string().nullable(),
  /** The owner's own notice, or null when the country default is used. */
  privacyNotice: z.string().nullable(),
  /** The notice shown to customers (own or country default). */
  effectivePrivacyNotice: z.string(),
  privacyNoticeVersion: z.number().int(),
  /** False once the store has products or orders: changing it would change existing prices. */
  canChangeCurrency: z.boolean(),
  isActive: z.boolean(),
  createdAt: z.string(),
});

export type Store = z.infer<typeof storeSchema>;
