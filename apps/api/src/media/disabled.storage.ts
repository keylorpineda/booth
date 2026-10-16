import { HttpStatus } from '@nestjs/common';

import { type ImageUrls, type MediaStorage, type StoredImage } from './media-storage';
import { AppException } from '../common/errors/app.exception';

/** Used in development when Cloudinary credentials are not set. */
export class DisabledStorage implements MediaStorage {
  uploadImage(): Promise<StoredImage> {
    return Promise.reject(
      new AppException(
        'MEDIA_NOT_CONFIGURED',
        'Image uploads are not configured. Set the CLOUDINARY_* variables.',
        HttpStatus.SERVICE_UNAVAILABLE,
      ),
    );
  }

  deleteImage(): Promise<void> {
    return Promise.resolve();
  }

  imageUrls(): ImageUrls {
    return { thumb: '', medium: '', large: '' };
  }
}
