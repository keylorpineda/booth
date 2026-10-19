import { HttpStatus, Injectable } from '@nestjs/common';

import { type Quote, type QuoteRequest } from '@booth/shared';

import { AppException } from '../common/errors/app.exception';
import { type Db } from '../prisma/prisma-tx';

export interface PricingStore {
  id: string;
  currency: string;
  pickupEnabled: boolean;
  deliveryEnabled: boolean;
}

export interface PricedLine {
  productId: string;
  name: string;
  unitPriceMinor: bigint;
  quantity: number;
  lineTotalMinor: bigint;
  trackStock: boolean;
  stock: number;
}

export interface PricedCart {
  lines: PricedLine[];
  zone: { id: string; name: string; feeMinor: bigint } | null;
  subtotalMinor: bigint;
  deliveryFeeMinor: bigint;
  totalMinor: bigint;
}

/** Computes every price on the server from current product data. Client prices are never read. */
@Injectable()
export class OrderPricingService {
  async price(db: Db, store: PricingStore, request: QuoteRequest): Promise<PricedCart> {
    const ids = request.items.map((item) => item.productId);
    const products = await db.product.findMany({
      where: { storeId: store.id, id: { in: ids }, isActive: true },
      select: { id: true, name: true, priceMinor: true, trackStock: true, stock: true },
    });
    const byId = new Map(products.map((product) => [product.id, product]));

    const missing = ids.filter((id) => !byId.has(id));
    if (missing.length > 0) {
      throw new AppException(
        'PRODUCT_UNAVAILABLE',
        'Some products are no longer available',
        HttpStatus.CONFLICT,
        { productIds: missing },
      );
    }

    const zone = await this.resolveFulfillment(db, store, request);
    const lines = request.items.map((item): PricedLine => {
      const product = byId.get(item.productId);
      if (!product) throw new Error('unreachable');
      return {
        productId: product.id,
        name: product.name,
        unitPriceMinor: product.priceMinor,
        quantity: item.quantity,
        lineTotalMinor: product.priceMinor * BigInt(item.quantity),
        trackStock: product.trackStock,
        stock: product.stock,
      };
    });

    const subtotalMinor = lines.reduce((sum, line) => sum + line.lineTotalMinor, 0n);
    const deliveryFeeMinor = zone?.feeMinor ?? 0n;
    return {
      lines,
      zone,
      subtotalMinor,
      deliveryFeeMinor,
      totalMinor: subtotalMinor + deliveryFeeMinor,
    };
  }

  /** Reports products whose tracked stock is below the requested quantity (quote only). */
  assertInStock(cart: PricedCart): void {
    const short = cart.lines.filter((line) => line.trackStock && line.stock < line.quantity);
    if (short.length > 0) {
      throw new AppException(
        'OUT_OF_STOCK',
        'Some products are no longer available in that quantity',
        HttpStatus.CONFLICT,
        { productIds: short.map((line) => line.productId) },
      );
    }
  }

  toQuote(cart: PricedCart, currency: string): Quote {
    return {
      currency,
      lines: cart.lines.map((line) => ({
        productId: line.productId,
        name: line.name,
        unitPriceMinor: Number(line.unitPriceMinor),
        quantity: line.quantity,
        lineTotalMinor: Number(line.lineTotalMinor),
      })),
      subtotalMinor: Number(cart.subtotalMinor),
      deliveryFeeMinor: Number(cart.deliveryFeeMinor),
      totalMinor: Number(cart.totalMinor),
    };
  }

  private async resolveFulfillment(
    db: Db,
    store: PricingStore,
    request: QuoteRequest,
  ): Promise<PricedCart['zone']> {
    if (request.fulfillment === 'PICKUP') {
      if (!store.pickupEnabled) throw fieldError('fulfillment', 'Pickup is not available');
      return null;
    }
    if (!store.deliveryEnabled) throw fieldError('fulfillment', 'Delivery is not available');
    const zone = request.deliveryZoneId
      ? await db.deliveryZone.findFirst({
          where: { id: request.deliveryZoneId, storeId: store.id, isActive: true },
          select: { id: true, name: true, feeMinor: true },
        })
      : null;
    if (!zone) throw fieldError('deliveryZoneId', 'Delivery zone not found');
    return zone;
  }
}

function fieldError(path: string, message: string): AppException {
  return new AppException('VALIDATION_ERROR', 'Invalid request', HttpStatus.BAD_REQUEST, {
    fields: [{ path, message }],
  });
}
