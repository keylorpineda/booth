import { HttpStatus, Inject, Injectable } from '@nestjs/common';

import { type Store, type StoreImageKind, type UpdateStoreInput } from '@booth/shared';

import { StorePresenter } from './store-presenter.service';
import { AppException } from '../common/errors/app.exception';
import { definedOnly } from '../common/utils/defined-only';
import { MEDIA_STORAGE, type MediaStorage } from '../media/media-storage';
import { PrismaService } from '../prisma/prisma.service';

const COLUMN = { logo: 'logoPublicId', cover: 'coverPublicId' } as const;

/** Settings and branding of the caller's own store (storeId comes from the auth context). */
@Injectable()
export class StoreBrandingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly presenter: StorePresenter,
    @Inject(MEDIA_STORAGE) private readonly storage: MediaStorage,
  ) {}

  async update(storeId: string, input: UpdateStoreInput): Promise<Store> {
    const changes = definedOnly(input);

    const store = await this.prisma.$transaction(async (tx) => {
      const current = await tx.store.findUniqueOrThrow({ where: { id: storeId } });

      if (changes.currency && changes.currency !== current.currency) {
        if (!(await this.presenter.canChangeCurrency(storeId, tx))) {
          throw new AppException(
            'CURRENCY_LOCKED',
            'The currency cannot change once the store has products or orders',
            HttpStatus.CONFLICT,
          );
        }
      }

      const pickup = changes.pickupEnabled ?? current.pickupEnabled;
      const delivery = changes.deliveryEnabled ?? current.deliveryEnabled;
      if (!pickup && !delivery) {
        throw new AppException('VALIDATION_ERROR', 'Invalid request', HttpStatus.BAD_REQUEST, {
          fields: [{ path: 'pickupEnabled', message: 'Enable pickup or delivery' }],
        });
      }

      // A new notice text is a new version: orders record which version the customer accepted.
      const noticeChanged =
        changes.privacyNotice !== undefined && changes.privacyNotice !== current.privacyNotice;

      return tx.store.update({
        where: { id: storeId },
        data: {
          ...changes,
          ...(noticeChanged && { privacyNoticeVersion: { increment: 1 } }),
        },
      });
    });
    return this.presenter.present(store);
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
    return this.presenter.present(store);
  }

  async removeImage(storeId: string, kind: StoreImageKind): Promise<Store> {
    const previous = await this.currentImage(storeId, kind);
    const store = await this.prisma.store.update({
      where: { id: storeId },
      data: { [COLUMN[kind]]: null },
    });
    if (previous) await this.storage.deleteImage(previous);
    return this.presenter.present(store);
  }

  private async currentImage(storeId: string, kind: StoreImageKind): Promise<string | null> {
    const store = await this.prisma.store.findUniqueOrThrow({
      where: { id: storeId },
      select: { logoPublicId: true, coverPublicId: true },
    });
    return store[COLUMN[kind]];
  }
}
