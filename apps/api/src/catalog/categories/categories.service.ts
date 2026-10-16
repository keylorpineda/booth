import { HttpStatus, Injectable } from '@nestjs/common';

import { type Category, type CreateCategoryInput, type UpdateCategoryInput } from '@booth/shared';

import { AppException } from '../../common/errors/app.exception';
import { notFound } from '../../common/errors/not-found';
import { definedOnly } from '../../common/utils/defined-only';
import { isUniqueViolation } from '../../prisma/prisma-errors';
import { PrismaService } from '../../prisma/prisma.service';

const withCount = { _count: { select: { products: true } } } as const;

interface CategoryRecord {
  id: string;
  name: string;
  position: number;
  isActive: boolean;
  _count: { products: number };
}

const toDto = (category: CategoryRecord): Category => ({
  id: category.id,
  name: category.name,
  position: category.position,
  isActive: category.isActive,
  productCount: category._count.products,
});

/** Every query is scoped by the caller's storeId (from the auth context, never the request). */
@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(storeId: string): Promise<Category[]> {
    const categories = await this.prisma.category.findMany({
      where: { storeId },
      orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
      include: withCount,
    });
    return categories.map(toDto);
  }

  async create(storeId: string, input: CreateCategoryInput): Promise<Category> {
    const last = await this.prisma.category.aggregate({
      where: { storeId },
      _max: { position: true },
    });
    try {
      const category = await this.prisma.category.create({
        data: { ...input, storeId, position: (last._max.position ?? -1) + 1 },
        include: withCount,
      });
      return toDto(category);
    } catch (error) {
      throw mapNameConflict(error);
    }
  }

  async update(storeId: string, id: string, input: UpdateCategoryInput): Promise<Category> {
    await this.assertOwned(storeId, id);
    try {
      const category = await this.prisma.category.update({
        where: { id },
        data: definedOnly(input),
        include: withCount,
      });
      return toDto(category);
    } catch (error) {
      throw mapNameConflict(error);
    }
  }

  /** Products in the category stay, uncategorized (FK `ON DELETE SET NULL`). */
  async remove(storeId: string, id: string): Promise<void> {
    const { count } = await this.prisma.category.deleteMany({ where: { id, storeId } });
    if (count === 0) throw notFound('Category');
  }

  async reorder(storeId: string, ids: string[]): Promise<Category[]> {
    const owned = await this.prisma.category.count({ where: { storeId, id: { in: ids } } });
    if (owned !== ids.length) throw notFound('Category');

    await this.prisma.$transaction(
      ids.map((id, position) =>
        this.prisma.category.updateMany({ where: { id, storeId }, data: { position } }),
      ),
    );
    return this.list(storeId);
  }

  private async assertOwned(storeId: string, id: string): Promise<void> {
    const found = await this.prisma.category.findFirst({
      where: { id, storeId },
      select: { id: true },
    });
    if (!found) throw notFound('Category');
  }
}

function mapNameConflict(error: unknown): unknown {
  return isUniqueViolation(error, 'name')
    ? new AppException(
        'CATEGORY_NAME_TAKEN',
        'A category with this name already exists',
        HttpStatus.CONFLICT,
        { field: 'name' },
      )
    : error;
}
