import { HttpStatus, Inject, Injectable } from '@nestjs/common';

import { MAX_PRODUCT_IMAGES, type ProductImage } from '@booth/shared';

import { toImageDto } from './product.mapper';
import { ProductsService } from './products.service';
import { AppException } from '../../common/errors/app.exception';
import { notFound } from '../../common/errors/not-found';
import { MEDIA_STORAGE, type MediaStorage } from '../../media/media-storage';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ProductImagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly products: ProductsService,
    @Inject(MEDIA_STORAGE) private readonly storage: MediaStorage,
  ) {}

  async add(storeId: string, productId: string, file: Buffer): Promise<ProductImage> {
    await this.products.assertOwned(storeId, productId);
    const count = await this.prisma.productImage.count({ where: { productId } });
    if (count >= MAX_PRODUCT_IMAGES) {
      throw new AppException(
        'TOO_MANY_IMAGES',
        `A product can have at most ${MAX_PRODUCT_IMAGES} images`,
        HttpStatus.CONFLICT,
      );
    }

    const stored = await this.storage.uploadImage(file, `booth/${storeId}/products`);
    const image = await this.prisma.productImage.create({
      data: {
        productId,
        publicId: stored.publicId,
        width: stored.width,
        height: stored.height,
        position: count,
      },
    });
    return toImageDto(image, this.storage);
  }

  async remove(storeId: string, productId: string, imageId: string): Promise<void> {
    const image = await this.prisma.productImage.findFirst({
      where: { id: imageId, productId, product: { storeId } },
      select: { id: true, publicId: true },
    });
    if (!image) throw notFound('Image');

    await this.prisma.productImage.delete({ where: { id: image.id } });
    await this.storage.deleteImage(image.publicId);
  }

  async reorder(storeId: string, productId: string, ids: string[]): Promise<void> {
    const owned = await this.prisma.productImage.count({
      where: { id: { in: ids }, productId, product: { storeId } },
    });
    if (owned !== ids.length) throw notFound('Image');

    await this.prisma.$transaction(
      ids.map((id, position) =>
        this.prisma.productImage.updateMany({ where: { id, productId }, data: { position } }),
      ),
    );
  }
}
