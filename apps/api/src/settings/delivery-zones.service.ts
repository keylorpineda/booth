import { HttpStatus, Injectable } from '@nestjs/common';

import {
  type CreateDeliveryZoneInput,
  type DeliveryZone,
  type UpdateDeliveryZoneInput,
} from '@booth/shared';

import { AppException } from '../common/errors/app.exception';
import { notFound } from '../common/errors/not-found';
import { definedOnly } from '../common/utils/defined-only';
import { type DeliveryZone as DeliveryZoneRecord } from '../generated/prisma/client';
import { isUniqueViolation } from '../prisma/prisma-errors';
import { PrismaService } from '../prisma/prisma.service';

const toDto = (zone: DeliveryZoneRecord): DeliveryZone => ({
  id: zone.id,
  name: zone.name,
  feeMinor: Number(zone.feeMinor),
  isActive: zone.isActive,
  position: zone.position,
});

/** Delivery zones of the caller's store. Orders keep a snapshot of the zone name and fee. */
@Injectable()
export class DeliveryZonesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(storeId: string): Promise<DeliveryZone[]> {
    const zones = await this.prisma.deliveryZone.findMany({
      where: { storeId },
      orderBy: [{ position: 'asc' }, { id: 'asc' }],
    });
    return zones.map(toDto);
  }

  async create(storeId: string, input: CreateDeliveryZoneInput): Promise<DeliveryZone> {
    const last = await this.prisma.deliveryZone.aggregate({
      where: { storeId },
      _max: { position: true },
    });
    try {
      const zone = await this.prisma.deliveryZone.create({
        data: {
          storeId,
          name: input.name,
          feeMinor: BigInt(input.feeMinor),
          isActive: input.isActive,
          position: (last._max.position ?? -1) + 1,
        },
      });
      return toDto(zone);
    } catch (error) {
      throw mapNameConflict(error);
    }
  }

  async update(storeId: string, id: string, input: UpdateDeliveryZoneInput): Promise<DeliveryZone> {
    await this.assertOwned(storeId, id);
    const { feeMinor, ...rest } = definedOnly(input);
    try {
      const zone = await this.prisma.deliveryZone.update({
        where: { id },
        data: { ...rest, ...(feeMinor !== undefined && { feeMinor: BigInt(feeMinor) }) },
      });
      return toDto(zone);
    } catch (error) {
      throw mapNameConflict(error);
    }
  }

  async remove(storeId: string, id: string): Promise<void> {
    const { count } = await this.prisma.deliveryZone.deleteMany({ where: { id, storeId } });
    if (count === 0) throw notFound('Delivery zone');
  }

  async reorder(storeId: string, ids: string[]): Promise<DeliveryZone[]> {
    const owned = await this.prisma.deliveryZone.count({ where: { storeId, id: { in: ids } } });
    if (owned !== ids.length) throw notFound('Delivery zone');
    await this.prisma.$transaction(
      ids.map((id, position) =>
        this.prisma.deliveryZone.updateMany({ where: { id, storeId }, data: { position } }),
      ),
    );
    return this.list(storeId);
  }

  private async assertOwned(storeId: string, id: string): Promise<void> {
    const found = await this.prisma.deliveryZone.findFirst({
      where: { id, storeId },
      select: { id: true },
    });
    if (!found) throw notFound('Delivery zone');
  }
}

function mapNameConflict(error: unknown): unknown {
  return isUniqueViolation(error, 'name')
    ? new AppException(
        'ZONE_NAME_TAKEN',
        'A zone with this name already exists',
        HttpStatus.CONFLICT,
        {
          field: 'name',
        },
      )
    : error;
}
