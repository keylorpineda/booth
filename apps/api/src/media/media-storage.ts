import { type ProductImage } from '@booth/shared';

export interface StoredImage {
  publicId: string;
  width: number;
  height: number;
  bytes: number;
}

/** Receipt formats accepted from customers (phone screenshots, bank PDFs, iPhone HEIC). */
export type PrivateFileFormat = 'jpg' | 'png' | 'webp' | 'heic' | 'pdf';

export interface StoredPrivateFile {
  publicId: string;
  bytes: number;
}

export type ImageUrls = ProductImage['urls'];

/** Image hosting behind an interface: Cloudinary in production, a fake in tests. */
export interface MediaStorage {
  /** Uploads a validated image into `folder` (e.g. `booth/<storeId>/products`). */
  uploadImage(file: Buffer, folder: string): Promise<StoredImage>;
  /**
   * Copies a remote image into storage under a fixed public id. If that id already exists, the
   * stored image is reused (nothing is uploaded again). Used for the demo stores' photos.
   */
  importImage(sourceUrl: string, publicId: string): Promise<StoredImage>;
  deleteImage(publicId: string): Promise<void>;
  /** Optimized delivery URLs (auto format and quality, limited width). */
  imageUrls(publicId: string): ImageUrls;
  /** Private upload (payment receipts): only reachable through short-lived signed URLs. */
  uploadPrivate(
    file: Buffer,
    folder: string,
    format: PrivateFileFormat,
  ): Promise<StoredPrivateFile>;
  deletePrivate(publicId: string): Promise<void>;
  /** Signed URL that stops working after `ttlSeconds`. */
  privateUrl(publicId: string, format: PrivateFileFormat, ttlSeconds: number): string;
}

export const MEDIA_STORAGE = Symbol('MEDIA_STORAGE');

/** Widths for the responsive variants. */
export const IMAGE_WIDTHS = { thumb: 320, medium: 800, large: 1600 } as const;
