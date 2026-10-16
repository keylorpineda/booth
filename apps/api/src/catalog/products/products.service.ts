import { HttpStatus, Inject, Injectable } from '@nestjs/common';

import {
  type CreateProductInput,
  type Paginated,
  type Product,
  type ProductListQuery,
  type UpdateProductInput,
} from '@booth/shared';

import { imagesInOrder, toProductDto } from './product.mapper';
import { AppException } from '../../common/errors/app.exception';
import { notFound } from '../../common/errors/not-found';
import { definedOnly } from '../../common/utils/defined-only';
import { type Prisma } from '../../generated/prisma/client';
import { MEDIA_STORAGE, type MediaStorage } from '../../media/media-storage';
import { PrismaService } from '../../prisma/prisma.service';

/** Every query is scoped by the caller's storeId (from the auth context, never the request). */
@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(MEDIA_STORAGE) private readonly storage: MediaStorage,
  ) {}

  async list(storeId: string, query: ProductListQuery): Promise<Paginated<Product>> {
    const where: Prisma.ProductWhereInput = {
      storeId,
      ...(query.categoryId && { categoryId: query.categoryId }),
      ...(query.q && { name: { contains: query.q, mode: 'insensitive' } }),
    };
    const products = await this.prisma.product.findMany({
      where,
      orderBy: [{ position: 'asc' }, { id: 'asc' }],
      include: imagesInOrder,
      take: query.limit + 1,
      ...(query.cursor && { cursor: { id: query.cursor }, skip: 1 }),
    });

    const page = products.slice(0, query.limit);
    return {
      data: page.map((product) => toProductDto(product, this.storage)),
      nextCursor: products.length > query.limit ? (page.at(-1)?.id ?? null) : null,
    };
  }

  async get(storeId: string, id: string): Promise<Product> {
    const product = await this.prisma.product.findFirst({
      where: { id, storeId },
      include: imagesInOrder,
    });
    if (!product) throw notFound('Product');
    return toProductDto(product, this.storage);
  }

  async create(storeId: string, input: CreateProductInput): Promise<Product> {
    await this.assertCategory(storeId, input.categoryId);
    const last = await this.prisma.product.aggregate({
      where: { storeId },
      _max: { position: true },
    });

    const product = await this.prisma.product.create({
      data: {
        ...input,
        storeId,
        priceMinor: BigInt(input.priceMinor),
        position: (last._max.position ?? -1) + 1,
      },
      include: imagesInOrder,
    });
    return toProductDto(product, this.storage);
  }

  async update(storeId: string, id: string, input: UpdateProductInput): Promise<Product> {
    await this.assertOwned(storeId, id);
    await this.assertCategory(storeId, input.categoryId);

    const { priceMinor, ...rest } = definedOnly(input);
    const product = await this.prisma.product.update({
      where: { id },
      data: { ...rest, ...(priceMinor !== undefined && { priceMinor: BigInt(priceMinor) }) },
      include: imagesInOrder,
    });
    return toProductDto(product, this.storage);
  }

  /** Past orders keep their snapshots (order items only hold a nullable product id). */
  async remove(storeId: string, id: string): Promise<void> {
    const product = await this.prisma.product.findFirst({
      where: { id, storeId },
      select: { id: true, images: { select: { publicId: true } } },
    });
    if (!product) throw notFound('Product');

    await this.prisma.product.delete({ where: { id } });
    await Promise.all(product.images.map((image) => this.storage.deleteImage(image.publicId)));
  }

  async reorder(storeId: string, ids: string[]): Promise<void> {
    const owned = await this.prisma.product.count({ where: { storeId, id: { in: ids } } });
    if (owned !== ids.length) throw notFound('Product');

    await this.prisma.$transaction(
      ids.map((id, position) =>
        this.prisma.product.updateMany({ where: { id, storeId }, data: { position } }),
      ),
    );
  }

  async assertOwned(storeId: string, id: string): Promise<void> {
    const found = await this.prisma.product.findFirst({
      where: { id, storeId },
      select: { id: true },
    });
    if (!found) throw notFound('Product');
  }

  /** A product can only point at a category of the same store. */
  private async assertCategory(
    storeId: string,
    categoryId: string | null | undefined,
  ): Promise<void> {
    if (!categoryId) return;
    const found = await this.prisma.category.findFirst({
      where: { id: categoryId, storeId },
      select: { id: true },
    });
    if (!found) {
      throw new AppException('VALIDATION_ERROR', 'Invalid request', HttpStatus.BAD_REQUEST, {
        fields: [{ path: 'categoryId', message: 'Category not found' }],
      });
    }
  }
}
