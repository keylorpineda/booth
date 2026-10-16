import { HttpStatus } from '@nestjs/common';

import { AppException } from '../common/errors/app.exception';

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export type ImageType = 'jpeg' | 'png' | 'webp' | 'avif';

const startsWith = (buffer: Buffer, bytes: number[], offset = 0): boolean =>
  bytes.every((byte, i) => buffer[offset + i] === byte);

const ascii = (buffer: Buffer, start: number, end: number): string =>
  buffer.subarray(start, end).toString('latin1');

/** Detects the real type from the file's magic bytes; the client-sent MIME type is not trusted. */
export function detectImageType(buffer: Buffer): ImageType | null {
  if (startsWith(buffer, [0xff, 0xd8, 0xff])) return 'jpeg';
  if (startsWith(buffer, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return 'png';
  if (ascii(buffer, 0, 4) === 'RIFF' && ascii(buffer, 8, 12) === 'WEBP') return 'webp';
  if (ascii(buffer, 4, 8) === 'ftyp' && ['avif', 'avis'].includes(ascii(buffer, 8, 12))) {
    return 'avif';
  }
  return null;
}

/** Validates an uploaded image: present, not too large, and really an image. */
export function assertImageFile(file: Express.Multer.File | undefined): Buffer {
  if (!file) {
    throw new AppException('VALIDATION_ERROR', 'Missing file', HttpStatus.BAD_REQUEST, {
      fields: [{ path: 'file', message: 'Required' }],
    });
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new AppException(
      'FILE_TOO_LARGE',
      `Images must be ${MAX_IMAGE_BYTES / 1024 / 1024} MB or smaller`,
      HttpStatus.PAYLOAD_TOO_LARGE,
    );
  }
  if (!detectImageType(file.buffer)) {
    throw new AppException(
      'UNSUPPORTED_FILE_TYPE',
      'Use a JPEG, PNG, WebP or AVIF image',
      HttpStatus.UNSUPPORTED_MEDIA_TYPE,
    );
  }
  return file.buffer;
}
