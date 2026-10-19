import { Injectable } from '@nestjs/common';

import {
  type OwnerOrder,
  type OwnerOrderListQuery,
  type OwnerOrderSummary,
  type Paginated,
} from '@booth/shared';

import { toOwnerOrder, toOwnerOrderSummary } from './owner-order.mapper';
import { notFound } from '../../common/errors/not-found';
import { type Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { OrderExpirationService } from '../order-expiration.service';

export const orderDetailInclude = {
  items: { orderBy: { id: 'asc' } },
  events: { orderBy: { createdAt: 'asc' } },
  receipt: {
    include: {
      verification: true,
    },
  },
} as const;

/** "+506 7777", "(415) 555-2671", "7777": digits with phone punctuation, at least three digits. */
const PHONE_QUERY = /^\+?[\d\s().-]*\d{3}[\d\s().-]*$/;

/** Read side of the owner's orders. Every query is scoped by the caller's storeId. */
@Injectable()
export class OwnerOrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly expiration: OrderExpirationService,
  ) {}

  async list(storeId: string, query: OwnerOrderListQuery): Promise<Paginated<OwnerOrderSummary>> {
    // Lazy expiry: the list must never show a stale order as still pending.
    await this.expiration.expireStale(storeId);

    const search = query.q?.trim();
    // Phones are searched only for phone-like queries: the digits of a code such as "SW12CJ"
    // would otherwise match any phone containing "12".
    const digits = search && PHONE_QUERY.test(search) ? search.replace(/\D/g, '') : '';
    const where: Prisma.OrderWhereInput = {
      storeId,
      ...(query.status?.length && { status: { in: query.status } }),
      ...(query.paymentStatus && { paymentStatus: query.paymentStatus }),
      ...((query.from ?? query.to) && {
        createdAt: { ...(query.from && { gte: query.from }), ...(query.to && { lte: query.to }) },
      }),
      ...(search && {
        OR: [
          { code: { contains: search.toUpperCase() } },
          { customerName: { contains: search, mode: 'insensitive' } },
          ...(digits ? [{ customerPhone: { contains: digits } }] : []),
        ],
      }),
    };

    const orders = await this.prisma.order.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      include: {
        receipt: {
          select: {
            id: true,
            verification: { select: { status: true } },
          },
        },
        _count: { select: { items: true } },
      },
      take: query.limit + 1,
      ...(query.cursor && { cursor: { id: query.cursor }, skip: 1 }),
    });

    const page = orders.slice(0, query.limit);
    return {
      data: page.map(toOwnerOrderSummary),
      nextCursor: orders.length > query.limit ? (page.at(-1)?.id ?? null) : null,
    };
  }

  async get(storeId: string, id: string): Promise<OwnerOrder> {
    await this.expiration.expireStale(storeId);
    const order = await this.prisma.order.findFirst({
      where: { id, storeId },
      include: orderDetailInclude,
    });
    if (!order) throw notFound('Order');
    return toOwnerOrder(order);
  }
}
