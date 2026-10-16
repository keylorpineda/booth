import { defaultPrivacyNotice, readableForeground, type Store } from '@booth/shared';

import { type Store as StoreRecord } from '../generated/prisma/client';
import { type MediaStorage } from '../media/media-storage';

export interface StoreDtoContext {
  storage: MediaStorage;
  /** False once the store has products or orders (see StorePresenter). */
  canChangeCurrency: boolean;
}

/** Owner-facing store DTO. Internal fields (owner id, asset ids) stay out. */
export function toStoreDto(
  store: StoreRecord,
  { storage, canChangeCurrency }: StoreDtoContext,
): Store {
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
    pickupAddress: store.pickupAddress,
    deliveryEnabled: store.deliveryEnabled,
    cashEnabled: store.cashEnabled,
    pricesNote: store.pricesNote,
    privacyNotice: store.privacyNotice,
    effectivePrivacyNotice:
      store.privacyNotice ?? defaultPrivacyNotice(store.country, store.locale, store.name),
    privacyNoticeVersion: store.privacyNoticeVersion,
    canChangeCurrency,
    isActive: store.isActive,
    createdAt: store.createdAt.toISOString(),
  };
}
