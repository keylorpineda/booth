import { HttpStatus } from '@nestjs/common';

import { assertImageFile, detectImageType, MAX_IMAGE_BYTES } from './image-file';
import { AppException } from '../common/errors/app.exception';

const bytes = (...values: number[]) => Buffer.from(values);
const text = (value: string) => Buffer.from(value, 'latin1');

const file = (buffer: Buffer, size = buffer.length) => ({ buffer, size }) as Express.Multer.File;

describe('detectImageType', () => {
  it.each([
    ['jpeg', bytes(0xff, 0xd8, 0xff, 0xe0)],
    ['png', bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)],
    ['webp', text('RIFF\0\0\0\0WEBPVP8 ')],
    ['avif', text('\0\0\0\x1cftypavif')],
  ])('detects %s', (type, buffer) => {
    expect(detectImageType(buffer)).toBe(type);
  });

  it.each([
    ['a PDF', text('%PDF-1.7')],
    ['an SVG (can carry scripts)', text('<svg xmlns="http://www.w3.org/2000/svg">')],
    ['HTML renamed to .jpg', text('<html><script>alert(1)</script>')],
    ['an empty file', Buffer.alloc(0)],
  ])('rejects %s', (_case, buffer) => {
    expect(detectImageType(buffer)).toBeNull();
  });
});

describe('assertImageFile', () => {
  const expectError = (run: () => unknown, code: string, status: HttpStatus) => {
    try {
      run();
      throw new Error('expected an error');
    } catch (error) {
      expect(error).toBeInstanceOf(AppException);
      expect((error as AppException).code).toBe(code);
      expect((error as AppException).getStatus()).toBe(status);
    }
  };

  it('returns the buffer of a valid image', () => {
    const png = bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a);
    expect(assertImageFile(file(png))).toBe(png);
  });

  it('requires a file', () => {
    expectError(() => assertImageFile(undefined), 'VALIDATION_ERROR', HttpStatus.BAD_REQUEST);
  });

  it('rejects files over the size limit', () => {
    expectError(
      () => assertImageFile(file(bytes(0xff, 0xd8, 0xff), MAX_IMAGE_BYTES + 1)),
      'FILE_TOO_LARGE',
      HttpStatus.PAYLOAD_TOO_LARGE,
    );
  });

  it('rejects non-images', () => {
    expectError(
      () => assertImageFile(file(text('%PDF-1.7'))),
      'UNSUPPORTED_FILE_TYPE',
      HttpStatus.UNSUPPORTED_MEDIA_TYPE,
    );
  });
});
