import { Logger } from '@nestjs/common';
import { v2 as cloudinary, type UploadApiResponse } from 'cloudinary';

import {
  IMAGE_WIDTHS,
  type ImageUrls,
  type MediaStorage,
  type PrivateFileFormat,
  type StoredImage,
  type StoredPrivateFile,
} from './media-storage';

interface CloudinaryCredentials {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
}

/** Signed server-side uploads. Credentials are passed per call (no global SDK state). */
export class CloudinaryStorage implements MediaStorage {
  private readonly logger = new Logger(CloudinaryStorage.name);

  constructor(private readonly credentials: CloudinaryCredentials) {}

  uploadImage(file: Buffer, folder: string): Promise<StoredImage> {
    return this.upload(file, { folder });
  }

  /**
   * Reuses the asset when the id exists; otherwise the API downloads the source itself and uploads
   * it (Cloudinary's own remote fetch was refused by the image host).
   */
  async importImage(sourceUrl: string, publicId: string): Promise<StoredImage> {
    const existing = await this.findImage(publicId);
    if (existing) return existing;

    const response = await fetch(sourceUrl);
    if (!response.ok) throw new Error(`Image download failed (${response.status}): ${sourceUrl}`);
    const file = Buffer.from(await response.arrayBuffer());
    return this.upload(file, { public_id: publicId, overwrite: false });
  }

  private async findImage(publicId: string): Promise<StoredImage | null> {
    try {
      const found = (await cloudinary.api.resource(publicId, this.auth())) as UploadApiResponse;
      return {
        publicId: found.public_id,
        width: found.width,
        height: found.height,
        bytes: found.bytes,
      };
    } catch (error) {
      if ((error as { error?: { http_code?: number } }).error?.http_code === 404) return null;
      throw error instanceof Error ? error : new Error('Cloudinary lookup failed');
    }
  }

  private upload(
    file: Buffer,
    target: { folder: string } | { public_id: string; overwrite: false },
  ): Promise<StoredImage> {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          ...this.auth(),
          ...target,
          resource_type: 'image',
          // Strip EXIF (location data from phone photos) and cap the stored original size.
          transformation: [
            { width: 2400, height: 2400, crop: 'limit' },
            { flags: 'strip_profile' },
          ],
        },
        (error, result?: UploadApiResponse) => {
          if (error || !result) {
            reject(error instanceof Error ? error : new Error('Cloudinary upload failed'));
            return;
          }
          resolve({
            publicId: result.public_id,
            width: result.width,
            height: result.height,
            bytes: result.bytes,
          });
        },
      );
      stream.end(file);
    });
  }

  async deleteImage(publicId: string): Promise<void> {
    try {
      await cloudinary.uploader.destroy(publicId, { ...this.auth(), invalidate: true });
    } catch (error) {
      // Orphaned assets are harmless; never fail the user's request because of them.
      this.logger.warn({ err: error, publicId }, 'Could not delete image');
    }
  }

  imageUrls(publicId: string): ImageUrls {
    const url = (width: number) =>
      cloudinary.url(publicId, {
        cloud_name: this.credentials.cloudName,
        secure: true,
        transformation: [{ width, crop: 'limit', fetch_format: 'auto', quality: 'auto' }],
      });
    return {
      thumb: url(IMAGE_WIDTHS.thumb),
      medium: url(IMAGE_WIDTHS.medium),
      large: url(IMAGE_WIDTHS.large),
    };
  }

  uploadPrivate(file: Buffer, folder: string): Promise<StoredPrivateFile> {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        // PDFs are stored as "image" resources too, which keeps one delivery path.
        { ...this.auth(), folder, resource_type: 'image', type: 'authenticated' },
        (error, result?: UploadApiResponse) => {
          if (error || !result) {
            reject(error instanceof Error ? error : new Error('Cloudinary upload failed'));
            return;
          }
          resolve({ publicId: result.public_id, bytes: result.bytes });
        },
      );
      stream.end(file);
    });
  }

  async deletePrivate(publicId: string): Promise<void> {
    try {
      await cloudinary.uploader.destroy(publicId, {
        ...this.auth(),
        type: 'authenticated',
        resource_type: 'image',
        invalidate: true,
      });
    } catch (error) {
      this.logger.warn({ err: error, publicId }, 'Could not delete private file');
    }
  }

  privateUrl(publicId: string, format: PrivateFileFormat, ttlSeconds: number): string {
    return cloudinary.utils.private_download_url(publicId, format, {
      ...this.auth(),
      resource_type: 'image',
      type: 'authenticated',
      expires_at: Math.floor(Date.now() / 1000) + ttlSeconds,
    });
  }

  private auth() {
    return {
      cloud_name: this.credentials.cloudName,
      api_key: this.credentials.apiKey,
      api_secret: this.credentials.apiSecret,
    };
  }
}
