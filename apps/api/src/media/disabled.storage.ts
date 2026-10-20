import { HttpStatus } from '@nestjs/common';

import {
  type ImageUrls,
  type MediaStorage,
  type StoredImage,
  type StoredPrivateFile,
} from './media-storage';
import { AppException } from '../common/errors/app.exception';

/** Used in development when Cloudinary credentials are not set. */
export class DisabledStorage implements MediaStorage {
  uploadImage(): Promise<StoredImage> {
    return Promise.reject(notConfigured());
  }

  deleteImage(): Promise<void> {
    return Promise.resolve();
  }

  imageUrls(): ImageUrls {
    return { thumb: '', medium: '', large: '' };
  }

  uploadPrivate(): Promise<StoredPrivateFile> {
    return Promise.reject(notConfigured());
  }

  deletePrivate(): Promise<void> {
    return Promise.resolve();
  }

  privateUrl(): string {
    return '';
  }
}

function notConfigured(): AppException {
  return new AppException(
    'MEDIA_NOT_CONFIGURED',
    'File uploads are not configured. Set the CLOUDINARY_* variables.',
    HttpStatus.SERVICE_UNAVAILABLE,
  );
}
