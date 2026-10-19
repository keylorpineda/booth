import { type Product, type ProductImage } from '@booth/shared';

import {
  type Product as ProductRecord,
  type ProductImage as ProductImageRecord,
} from '../../generated/prisma/client';
import { type MediaStorage } from '../../media/media-storage';

export type ProductWithImages = ProductRecord & { images: ProductImageRecord[] };

/** Images are always loaded in display order. */
export const imagesInOrder = { images: { orderBy: { position: 'asc' } } } as const;

export function toImageDto(image: ProductImageRecord, storage: MediaStorage): ProductImage {
  return {
    id: image.id,
    width: image.width,
    height: image.height,
    urls: storage.imageUrls(image.publicId),
  };
}

/** Money leaves the API as a JSON number of minor units (BigInt in the database). */
export function toProductDto(product: ProductWithImages, storage: MediaStorage): Product {
  return {
    id: product.id,
    name: product.name,
    description: product.description,
    priceMinor: Number(product.priceMinor),
    categoryId: product.categoryId,
    trackStock: product.trackStock,
    stock: product.stock,
    isActive: product.isActive,
    position: product.position,
    images: product.images.map((image) => toImageDto(image, storage)),
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
  };
}
