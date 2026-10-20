import { Logger } from '@nestjs/common';

import { DEMO_COVER_PHOTOS, DEMO_PRODUCT_PHOTOS, unsplashUrl } from './demo-photos';
import { type PrismaClient } from '../generated/prisma/client';
import { type MediaStorage } from '../media/media-storage';

/** Parallel imports: enough to finish fast without hammering the media service. */
const CONCURRENCY = 5;

/**
 * Gives every demo product its photo and every demo store its cover. Needs the media storage, so it
 * runs from the API (demo reset job), not from the database-only seed CLI. Idempotent: fixed public
 * ids in storage and fixed row ids here.
 */
export async function importDemoImages(
  prisma: PrismaClient,
  storage: MediaStorage,
): Promise<number> {
  const products = Object.entries(DEMO_PRODUCT_PHOTOS).map(([productId, photo]) => async () => {
    const image = await storage.importImage(unsplashUrl(photo), `booth/demo/${productId}`);
    const data = {
      publicId: image.publicId,
      width: image.width,
      height: image.height,
      position: 0,
    };
    await prisma.productImage.upsert({
      where: { id: `demo-img-${productId}` },
      update: data,
      create: { id: `demo-img-${productId}`, productId, ...data },
    });
  });
  const covers = Object.entries(DEMO_COVER_PHOTOS).map(([slug, photo]) => async () => {
    const image = await storage.importImage(unsplashUrl(photo), `booth/demo/cover-${slug}`);
    await prisma.store.update({ where: { slug }, data: { coverPublicId: image.publicId } });
  });

  // One failing photo must not fail the whole reset: it is retried on the next run.
  const tasks = [...products, ...covers];
  let imported = 0;
  for (let start = 0; start < tasks.length; start += CONCURRENCY) {
    const results = await Promise.allSettled(
      tasks.slice(start, start + CONCURRENCY).map((task) => task()),
    );
    for (const result of results) {
      if (result.status === 'fulfilled') imported += 1;
      else logger.warn({ err: result.reason as unknown }, 'Demo photo import failed');
    }
  }
  return imported;
}

const logger = new Logger('DemoImages');
