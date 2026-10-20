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
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          ...this.auth(),
          folder,
          resource_type: 'image',
          // Strip EXIF (location data from phone photos) and cap the stored original size.
          transformation: [
            { width: 2400, height: 2400, crop: 'limit' },
            { flags: 'strip_profile' },
          ],
        },
        (error, result?: UploadApiResponse) => {
          if (error || !result) {
            reject(uploadError(error));
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
            reject(uploadError(error));
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

/**
 * Cloudinary rejects with plain objects (`{ message, http_code }`), not Errors: keep their message,
 * otherwise a misconfiguration only shows up as "upload failed" in the logs.
 */
function uploadError(error: unknown): Error {
  if (error instanceof Error) return error;
  const { message, http_code: status } = (error ?? {}) as { message?: string; http_code?: number };
  return new Error(
    `Cloudinary upload failed${status ? ` (${status})` : ''}: ${message ?? 'no details'}`,
  );
}
