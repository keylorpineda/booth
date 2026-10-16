import { type Store } from '@booth/shared';

import { type Store as StoreRecord } from '../generated/prisma/client';

/** Owner-facing store DTO. Internal fields (owner id, asset ids) stay out. */
export function toStoreDto(store: StoreRecord): Store {
  return {
    id: store.id,
    slug: store.slug,
    name: store.name,
    description: store.description,
    whatsappPhone: store.whatsappPhone,
    brandColor: store.brandColor,
    country: store.country,
    currency: store.currency,
    timezone: store.timezone,
    locale: store.locale,
    acceptOrdersWhenClosed: store.acceptOrdersWhenClosed,
    orderExpirationMinutes: store.orderExpirationMinutes,
    pickupEnabled: store.pickupEnabled,
    deliveryEnabled: store.deliveryEnabled,
    cashEnabled: store.cashEnabled,
    pricesNote: store.pricesNote,
    isActive: store.isActive,
    createdAt: store.createdAt.toISOString(),
  };
}
