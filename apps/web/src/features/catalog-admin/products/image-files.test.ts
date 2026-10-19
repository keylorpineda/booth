import { describe, expect, it } from 'vitest';

import { IMAGE_MAX_BYTES, MAX_PRODUCT_IMAGES } from '@booth/shared';

import { checkImageFiles } from './image-files';

const file = (name: string, type: string, size = 1000) =>
  new File([new Uint8Array(size)], name, { type });

describe('checkImageFiles', () => {
  it('accepts JPEG, PNG, WebP and AVIF photos within the size limit', () => {
    const files = ['a.jpg', 'b.png', 'c.webp', 'd.avif'].map((name, index) =>
      file(name, ['image/jpeg', 'image/png', 'image/webp', 'image/avif'][index] ?? ''),
    );
    expect(checkImageFiles(files, 0)).toEqual({ accepted: files, rejected: [] });
  });

  it('refuses other types and files over 5 MB with the API error codes', () => {
    const { accepted, rejected } = checkImageFiles(
      [file('menu.pdf', 'application/pdf'), file('big.jpg', 'image/jpeg', IMAGE_MAX_BYTES + 1)],
      0,
    );
    expect(accepted).toEqual([]);
    expect(rejected).toEqual([
      { name: 'menu.pdf', code: 'UNSUPPORTED_FILE_TYPE' },
      { name: 'big.jpg', code: 'FILE_TOO_LARGE' },
    ]);
  });

  it('stops at the image limit, counting the photos already there', () => {
    const { accepted, rejected } = checkImageFiles(
      [file('1.jpg', 'image/jpeg'), file('2.jpg', 'image/jpeg')],
      MAX_PRODUCT_IMAGES - 1,
    );
    expect(accepted.map((f) => f.name)).toEqual(['1.jpg']);
    expect(rejected).toEqual([{ name: '2.jpg', code: 'TOO_MANY_IMAGES' }]);
  });
});
