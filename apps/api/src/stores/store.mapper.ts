import { readableForeground, type Store } from '@booth/shared';

import { type Store as StoreRecord } from '../generated/prisma/client';
import { type MediaStorage } from '../media/media-storage';

/** Owner-facing store DTO. Internal fields (owner id, asset ids) stay out. */
export function toStoreDto(store: StoreRecord, storage: MediaStorage): Store {
  return {
    id: store.id,
    slug: store.slug,
    name: store.name,
    description: store.description,
    whatsappPhone: store.whatsappPhone,
    brandColor: store.brandColor,
    brandForeground: readableForeground(store.brandColor),
    logoUrl: store.logoPublicId ? storage.imageUrls(store.logoPublicId).thumb : null,
    coverUrl: store.coverPublicId ? storage.imageUrls(store.coverPublicId).large : null,
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
