import { DEMO_COVER_PHOTOS, DEMO_PRODUCT_PHOTOS } from './demo-photos';
import { type PrismaClient } from '../generated/prisma/client';

/**
 * Points every demo product at its photo and every demo store at its cover. The files already live
 * in the media storage (see demo-photos.ts), so this only writes database rows: it cannot fail on
 * the media service and is idempotent (fixed row ids). Runs from the demo reset job when media
 * storage is configured, since the rows are useless without it.
 */
export async function attachDemoImages(prisma: PrismaClient): Promise<number> {
  for (const [productId, image] of Object.entries(DEMO_PRODUCT_PHOTOS)) {
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
  }
  for (const [slug, coverPublicId] of Object.entries(DEMO_COVER_PHOTOS)) {
    await prisma.store.update({ where: { slug }, data: { coverPublicId } });
  }
  return Object.keys(DEMO_PRODUCT_PHOTOS).length + Object.keys(DEMO_COVER_PHOTOS).length;
}
