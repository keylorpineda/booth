import { Inject, Injectable } from '@nestjs/common';

import {
  defaultPrivacyNotice,
  isOpenAt,
  nextOpening,
  type PublicCatalog,
  type PublicProduct,
  type PublicStore,
  readableForeground,
} from '@booth/shared';

import {
  imagesInOrder,
  type ProductWithImages,
  toImageDto,
} from '../catalog/products/product.mapper';
import { MEDIA_STORAGE, type MediaStorage } from '../media/media-storage';
import { PrismaService } from '../prisma/prisma.service';

/** Read-only storefront data. Only active records and public fields leave this service. */
@Injectable()
export class PublicStoreService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(MEDIA_STORAGE) private readonly storage: MediaStorage,
  ) {}

  async getStore(storeId: string, now = new Date()): Promise<PublicStore> {
    const store = await this.prisma.store.findUniqueOrThrow({
      where: { id: storeId },
      include: {
        businessHours: { orderBy: [{ weekday: 'asc' }, { opensAtMin: 'asc' }] },
        deliveryZones: { where: { isActive: true }, orderBy: { position: 'asc' } },
        paymentMethods: {
          where: { isActive: true, kind: 'TRANSFER' },
          orderBy: { position: 'asc' },
        },
      },
    });

    const hours = store.businessHours.map(({ weekday, opensAtMin, closesAtMin }) => ({
      weekday,
      opensAtMin,
      closesAtMin,
    }));
    const openNow = isOpenAt(hours, store.timezone, now);

    return {
      slug: store.slug,
      name: store.name,
      description: store.description,
      whatsappPhone: store.whatsappPhone,
      brandColor: store.brandColor,
      brandForeground: readableForeground(store.brandColor),
      logoUrl: store.logoPublicId ? this.storage.imageUrls(store.logoPublicId).thumb : null,
      coverUrl: store.coverPublicId ? this.storage.imageUrls(store.coverPublicId).large : null,
      country: store.country,
      currency: store.currency,
      timezone: store.timezone,
      locale: store.locale,
      pricesNote: store.pricesNote,
      hours,
      openNow,
      acceptingOrders: openNow || store.acceptOrdersWhenClosed,
      nextOpening: openNow ? null : nextOpening(hours, store.timezone, now),
      fulfillment: {
        pickup: { enabled: store.pickupEnabled, address: store.pickupAddress },
        delivery: {
          enabled: store.deliveryEnabled,
          zones: store.deliveryEnabled
            ? store.deliveryZones.map((zone) => ({
                id: zone.id,
                name: zone.name,
                feeMinor: Number(zone.feeMinor),
              }))
            : [],
        },
      },
      payment: {
        cash: store.cashEnabled,
        transfer: store.paymentMethods.map((method) => ({
          id: method.id,
          label: method.label,
          preset: method.preset,
          accountHolder: method.accountHolder,
          accountIdentifier: method.accountIdentifier,
          instructions: method.instructions,
          paymentUrl: method.paymentUrl,
        })),
      },
      privacy: {
        notice:
          store.privacyNotice ?? defaultPrivacyNotice(store.country, store.locale, store.name),
        version: store.privacyNoticeVersion,
      },
    };
  }

  async getCatalog(storeId: string): Promise<PublicCatalog> {
    const [categories, products] = await Promise.all([
      this.prisma.category.findMany({
        where: { storeId, isActive: true },
        orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
        select: { id: true, name: true },
      }),
      this.prisma.product.findMany({
        where: { storeId, isActive: true },
        orderBy: [{ position: 'asc' }, { id: 'asc' }],
        include: imagesInOrder,
      }),
    ]);

    const activeCategoryIds = new Set(categories.map((category) => category.id));
    const toPublic = (product: ProductWithImages): PublicProduct => ({
      id: product.id,
      name: product.name,
      description: product.description,
      priceMinor: Number(product.priceMinor),
      images: product.images.map((image) => toImageDto(image, this.storage)),
      available: !product.trackStock || product.stock > 0,
      stockLeft: product.trackStock ? product.stock : null,
    });

    return {
      categories: categories
        .map((category) => ({
          ...category,
          products: products.filter((p) => p.categoryId === category.id).map(toPublic),
        }))
        .filter((category) => category.products.length > 0),
      // Products without a category, or in a hidden one, are still sold.
      uncategorized: products
        .filter((p) => !p.categoryId || !activeCategoryIds.has(p.categoryId))
        .map(toPublic),
    };
  }
}
