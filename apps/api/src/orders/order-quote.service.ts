import { Injectable } from '@nestjs/common';

import { type Quote, type QuoteRequest } from '@booth/shared';

import { OrderPricingService } from './order-pricing.service';
import { PrismaService } from '../prisma/prisma.service';

/** Cart preview with server prices. Read-only: nothing is reserved. */
@Injectable()
export class OrderQuoteService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pricing: OrderPricingService,
  ) {}

  async quote(storeId: string, request: QuoteRequest): Promise<Quote> {
    const store = await this.prisma.store.findUniqueOrThrow({
      where: { id: storeId },
      select: { id: true, currency: true, pickupEnabled: true, deliveryEnabled: true },
    });
    const cart = await this.pricing.price(this.prisma, store, request);
    this.pricing.assertInStock(cart);
    return this.pricing.toQuote(cart, store.currency);
  }
}
