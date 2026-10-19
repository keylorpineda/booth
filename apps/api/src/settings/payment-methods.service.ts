import { Injectable } from '@nestjs/common';

import {
  type CreatePaymentMethodInput,
  type PaymentMethod,
  type UpdatePaymentMethodInput,
} from '@booth/shared';

import { notFound } from '../common/errors/not-found';
import { definedOnly } from '../common/utils/defined-only';
import { type PaymentMethod as PaymentMethodRecord } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';

const toDto = (method: PaymentMethodRecord): PaymentMethod => ({
  id: method.id,
  preset: method.preset,
  label: method.label,
  accountHolder: method.accountHolder,
  accountIdentifier: method.accountIdentifier,
  instructions: method.instructions,
  paymentUrl: method.paymentUrl,
  isActive: method.isActive,
  position: method.position,
});

/**
 * Transfer methods of the caller's store. Cash is a store toggle, not a method row.
 * Past orders keep a snapshot of the label, so deleting a method never changes them.
 */
@Injectable()
export class PaymentMethodsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(storeId: string): Promise<PaymentMethod[]> {
    const methods = await this.prisma.paymentMethod.findMany({
      where: { storeId, kind: 'TRANSFER' },
      orderBy: [{ position: 'asc' }, { id: 'asc' }],
    });
    return methods.map(toDto);
  }

  async create(storeId: string, input: CreatePaymentMethodInput): Promise<PaymentMethod> {
    const last = await this.prisma.paymentMethod.aggregate({
      where: { storeId },
      _max: { position: true },
    });
    const method = await this.prisma.paymentMethod.create({
      data: { ...input, storeId, kind: 'TRANSFER', position: (last._max.position ?? -1) + 1 },
    });
    return toDto(method);
  }

  async update(
    storeId: string,
    id: string,
    input: UpdatePaymentMethodInput,
  ): Promise<PaymentMethod> {
    await this.assertOwned(storeId, id);
    const method = await this.prisma.paymentMethod.update({
      where: { id },
      data: definedOnly(input),
    });
    return toDto(method);
  }

  async remove(storeId: string, id: string): Promise<void> {
    const { count } = await this.prisma.paymentMethod.deleteMany({ where: { id, storeId } });
    if (count === 0) throw notFound('Payment method');
  }

  async reorder(storeId: string, ids: string[]): Promise<PaymentMethod[]> {
    const owned = await this.prisma.paymentMethod.count({ where: { storeId, id: { in: ids } } });
    if (owned !== ids.length) throw notFound('Payment method');
    await this.prisma.$transaction(
      ids.map((id, position) =>
        this.prisma.paymentMethod.updateMany({ where: { id, storeId }, data: { position } }),
      ),
    );
    return this.list(storeId);
  }

  private async assertOwned(storeId: string, id: string): Promise<void> {
    const found = await this.prisma.paymentMethod.findFirst({
      where: { id, storeId },
      select: { id: true },
    });
    if (!found) throw notFound('Payment method');
  }
}
