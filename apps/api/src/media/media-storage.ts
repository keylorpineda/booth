import { type ProductImage } from '@booth/shared';

export interface StoredImage {
  publicId: string;
  width: number;
  height: number;
  bytes: number;
}

export type ImageUrls = ProductImage['urls'];

/** Image hosting behind an interface: Cloudinary in production, a fake in tests. */
export interface MediaStorage {
  /** Uploads a validated image into `folder` (e.g. `booth/<storeId>/products`). */
  uploadImage(file: Buffer, folder: string): Promise<StoredImage>;
  deleteImage(publicId: string): Promise<void>;
  /** Optimized delivery URLs (auto format and quality, limited width). */
  imageUrls(publicId: string): ImageUrls;
}

export const MEDIA_STORAGE = Symbol('MEDIA_STORAGE');

/** Widths for the responsive variants. */
export const IMAGE_WIDTHS = { thumb: 320, medium: 800, large: 1600 } as const;
