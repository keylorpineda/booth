import { Inject, Injectable } from '@nestjs/common';

import { type Store, type StoreImageKind, type UpdateStoreInput } from '@booth/shared';

import { toStoreDto } from './store.mapper';
import { definedOnly } from '../common/utils/defined-only';
import { MEDIA_STORAGE, type MediaStorage } from '../media/media-storage';
import { PrismaService } from '../prisma/prisma.service';

const COLUMN = { logo: 'logoPublicId', cover: 'coverPublicId' } as const;

/** Settings and branding of the caller's own store (storeId comes from the auth context). */
@Injectable()
export class StoreBrandingService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(MEDIA_STORAGE) private readonly storage: MediaStorage,
  ) {}

  async update(storeId: string, input: UpdateStoreInput): Promise<Store> {
    const store = await this.prisma.store.update({
      where: { id: storeId },
      data: definedOnly(input),
    });
    return toStoreDto(store, this.storage);
  }

  /** Uploads a new logo or cover and deletes the previous asset. */
  async setImage(storeId: string, kind: StoreImageKind, file: Buffer): Promise<Store> {
    const previous = await this.currentImage(storeId, kind);
    const stored = await this.storage.uploadImage(file, `booth/${storeId}/branding`);
    const store = await this.prisma.store.update({
      where: { id: storeId },
      data: { [COLUMN[kind]]: stored.publicId },
    });
    if (previous) await this.storage.deleteImage(previous);
    return toStoreDto(store, this.storage);
  }

  async removeImage(storeId: string, kind: StoreImageKind): Promise<Store> {
    const previous = await this.currentImage(storeId, kind);
    const store = await this.prisma.store.update({
      where: { id: storeId },
      data: { [COLUMN[kind]]: null },
    });
    if (previous) await this.storage.deleteImage(previous);
    return toStoreDto(store, this.storage);
  }

  private async currentImage(storeId: string, kind: StoreImageKind): Promise<string | null> {
    const store = await this.prisma.store.findUniqueOrThrow({
      where: { id: storeId },
      select: { logoPublicId: true, coverPublicId: true },
    });
    return store[COLUMN[kind]];
  }
}
