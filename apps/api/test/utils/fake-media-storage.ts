import {
  IMAGE_WIDTHS,
  type ImageUrls,
  type MediaStorage,
  type PrivateFileFormat,
  type StoredImage,
  type StoredPrivateFile,
} from '../../src/media/media-storage';

/** In-memory MediaStorage that records uploads and deletions. */
export class FakeMediaStorage implements MediaStorage {
  readonly uploads: { publicId: string; folder: string; bytes: number }[] = [];
  readonly privateUploads: { publicId: string; folder: string; format: PrivateFileFormat }[] = [];
  readonly deleted: string[] = [];
  readonly imports: { sourceUrl: string; publicId: string }[] = [];
  private counter = 0;

  uploadImage(file: Buffer, folder: string): Promise<StoredImage> {
    this.counter += 1;
    const publicId = `${folder}/img-${this.counter}`;
    this.uploads.push({ publicId, folder, bytes: file.length });
    return Promise.resolve({ publicId, width: 1200, height: 900, bytes: file.length });
  }

  importImage(sourceUrl: string, publicId: string): Promise<StoredImage> {
    this.imports.push({ sourceUrl, publicId });
    return Promise.resolve({ publicId, width: 1600, height: 1067, bytes: 0 });
  }

  deleteImage(publicId: string): Promise<void> {
    this.deleted.push(publicId);
    return Promise.resolve();
  }

  imageUrls(publicId: string): ImageUrls {
    const url = (width: number) => `https://img.test/w_${width}/${publicId}`;
    return {
      thumb: url(IMAGE_WIDTHS.thumb),
      medium: url(IMAGE_WIDTHS.medium),
      large: url(IMAGE_WIDTHS.large),
    };
  }

  uploadPrivate(
    file: Buffer,
    folder: string,
    format: PrivateFileFormat,
  ): Promise<StoredPrivateFile> {
    this.counter += 1;
    const publicId = `${folder}/private-${this.counter}`;
    this.privateUploads.push({ publicId, folder, format });
    return Promise.resolve({ publicId, bytes: file.length });
  }

  deletePrivate(publicId: string): Promise<void> {
    this.deleted.push(publicId);
    return Promise.resolve();
  }

  privateUrl(publicId: string, format: PrivateFileFormat, ttlSeconds: number): string {
    return `https://private.test/${publicId}.${format}?ttl=${ttlSeconds}`;
  }

  reset(): void {
    this.uploads.length = 0;
    this.privateUploads.length = 0;
    this.deleted.length = 0;
    this.imports.length = 0;
  }
}

/** Smallest buffers that pass the magic-byte check. */
export const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
export const PDF = Buffer.from('%PDF-1.7 not an image', 'latin1');
export const HEIC = Buffer.from([0, 0, 0, 0x18, ...Buffer.from('ftypheic', 'latin1'), 0, 0, 0, 0]);
