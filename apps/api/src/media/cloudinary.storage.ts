import { Logger } from '@nestjs/common';
import { v2 as cloudinary, type UploadApiResponse } from 'cloudinary';

import { IMAGE_WIDTHS, type ImageUrls, type MediaStorage, type StoredImage } from './media-storage';

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

  private auth() {
    return {
      cloud_name: this.credentials.cloudName,
      api_key: this.credentials.apiKey,
      api_secret: this.credentials.apiSecret,
    };
  }
}
