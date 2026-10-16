import { Inject, Injectable } from '@nestjs/common';

import { type Store } from '@booth/shared';

import { toStoreDto } from './store.mapper';
import { type Store as StoreRecord } from '../generated/prisma/client';
import { MEDIA_STORAGE, type MediaStorage } from '../media/media-storage';
import { type Db } from '../prisma/prisma-tx';
import { PrismaService } from '../prisma/prisma.service';

/** Builds the owner store DTO, including facts that need a query (can the currency change?). */
@Injectable()
export class StorePresenter {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(MEDIA_STORAGE) private readonly storage: MediaStorage,
  ) {}

  async present(store: StoreRecord): Promise<Store> {
    return toStoreDto(store, {
      storage: this.storage,
      canChangeCurrency: await this.canChangeCurrency(store.id),
    });
  }

  /** Prices are stored in minor units of the currency; once they exist the currency is fixed. */
  async canChangeCurrency(storeId: string, db: Db = this.prisma): Promise<boolean> {
    const [products, orders] = await Promise.all([
      db.product.count({ where: { storeId } }),
      db.order.count({ where: { storeId } }),
    ]);
    return products === 0 && orders === 0;
  }
}
