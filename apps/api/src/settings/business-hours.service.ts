import { Injectable } from '@nestjs/common';

import { type BusinessHour } from '@booth/shared';

import { PrismaService } from '../prisma/prisma.service';

const select = { weekday: true, opensAtMin: true, closesAtMin: true } as const;

/** Weekly opening hours in the store's time zone. An empty week means "always open". */
@Injectable()
export class BusinessHoursService {
  constructor(private readonly prisma: PrismaService) {}

  list(storeId: string): Promise<BusinessHour[]> {
    return this.prisma.businessHour.findMany({
      where: { storeId },
      orderBy: [{ weekday: 'asc' }, { opensAtMin: 'asc' }],
      select,
    });
  }

  /** Replaces the whole week atomically (the editor always sends every interval). */
  async replace(storeId: string, hours: BusinessHour[]): Promise<BusinessHour[]> {
    await this.prisma.$transaction([
      this.prisma.businessHour.deleteMany({ where: { storeId } }),
      this.prisma.businessHour.createMany({ data: hours.map((hour) => ({ ...hour, storeId })) }),
    ]);
    return this.list(storeId);
  }
}
