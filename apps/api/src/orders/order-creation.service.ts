import { HttpStatus, Injectable } from '@nestjs/common';

import { type CreateOrderInput, isOpenAt, nextOpening, type OrderCreated } from '@booth/shared';

import { OrderExpirationService } from './order-expiration.service';
import { generateOrderCode, generateTrackingToken } from './order-identifiers';
import { OrderPricingService } from './order-pricing.service';
import { StockService } from './stock.service';
import { buildOrderMessage, whatsappUrl } from './whatsapp-message';
import { AppException } from '../common/errors/app.exception';
import { type AppConfig } from '../config/app-config';
import { InjectConfig } from '../config/config.module';
import { type BusinessHour, type Store } from '../generated/prisma/client';
import { isUniqueViolation } from '../prisma/prisma-errors';
import { PrismaService } from '../prisma/prisma.service';

const CODE_ATTEMPTS = 5;
const MINUTE_MS = 60_000;

interface PaymentSnapshot {
  paymentMethodId: string | null;
  paymentMethodKind: 'CASH' | 'TRANSFER';
  paymentMethodLabel: string;
}

/**
 * Checkout: the order is saved as PENDING with reserved stock BEFORE the customer opens WhatsApp,
 * because a wa.me link cannot confirm that the message was sent.
 */
@Injectable()
export class OrderCreationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pricing: OrderPricingService,
    private readonly stock: StockService,
    private readonly expiration: OrderExpirationService,
    @InjectConfig() private readonly config: AppConfig,
  ) {}

  async create(storeId: string, input: CreateOrderInput): Promise<OrderCreated> {
    // Lazy expiry first, so stock held by abandoned orders is available again.
    await this.expiration.expireStale(storeId);

    const store = await this.prisma.store.findUniqueOrThrow({
      where: { id: storeId },
      include: { businessHours: true },
    });
    this.assertAcceptingOrders(store);
    const payment = await this.resolvePayment(store, input);

    for (let attempt = 1; ; attempt++) {
      try {
        return await this.insert(store, input, payment);
      } catch (error) {
        // The short code is random; retry on the rare collision within the store.
        if (attempt < CODE_ATTEMPTS && isUniqueViolation(error, 'code')) continue;
        throw error;
      }
    }
  }

  private async insert(
    store: StoreWithHours,
    input: CreateOrderInput,
    payment: PaymentSnapshot,
  ): Promise<OrderCreated> {
    const code = generateOrderCode();
    const trackingToken = generateTrackingToken();
    const expiresAt = new Date(Date.now() + store.orderExpirationMinutes * MINUTE_MS);

    const { cart, order } = await this.prisma.$transaction(async (tx) => {
      const priced = await this.pricing.price(tx, store, input);
      await this.stock.reserve(tx, store.id, priced.lines);

      const created = await tx.order.create({
        data: {
          storeId: store.id,
          code,
          trackingToken,
          customerName: input.customer.name,
          customerPhone: input.customer.phone,
          customerNote: input.customer.note ?? null,
          privacyConsentAt: new Date(),
          privacyNoticeVersion: store.privacyNoticeVersion,
          fulfillment: input.fulfillment,
          deliveryZoneId: priced.zone?.id ?? null,
          deliveryZoneName: priced.zone?.name ?? null,
          deliveryAddress:
            input.fulfillment === 'DELIVERY' ? (input.deliveryAddress ?? null) : null,
          deliveryFeeMinor: priced.deliveryFeeMinor,
          ...payment,
          currency: store.currency,
          subtotalMinor: priced.subtotalMinor,
          totalMinor: priced.totalMinor,
          expiresAt,
          // Snapshots: name and unit price are frozen; history never reads current products.
          items: {
            create: priced.lines.map((line) => ({
              productId: line.productId,
              productName: line.name,
              unitPriceMinor: line.unitPriceMinor,
              quantity: line.quantity,
              lineTotalMinor: line.lineTotalMinor,
              stockReserved: line.trackStock,
            })),
          },
          events: { create: { status: 'PENDING', actor: 'customer' } },
        },
      });
      return { cart: priced, order: created };
    });

    const trackingUrl = `${this.config.webPublicUrl}/t/${trackingToken}`;
    const message = buildOrderMessage({
      locale: store.locale,
      country: store.country,
      currency: store.currency,
      storeName: store.name,
      code,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      customerNote: order.customerNote,
      lines: cart.lines,
      subtotalMinor: cart.subtotalMinor,
      deliveryFeeMinor: cart.deliveryFeeMinor,
      totalMinor: cart.totalMinor,
      fulfillment: order.fulfillment,
      deliveryZoneName: order.deliveryZoneName,
      deliveryAddress: order.deliveryAddress,
      paymentLabel: payment.paymentMethodLabel,
      trackingUrl,
    });

    return {
      code,
      trackingToken,
      trackingUrl,
      status: order.status,
      currency: order.currency,
      subtotalMinor: Number(order.subtotalMinor),
      deliveryFeeMinor: Number(order.deliveryFeeMinor),
      totalMinor: Number(order.totalMinor),
      expiresAt: order.expiresAt?.toISOString() ?? null,
      whatsappUrl: whatsappUrl(store.whatsappPhone, message),
    };
  }

  private assertAcceptingOrders(store: StoreWithHours): void {
    if (store.acceptOrdersWhenClosed || isOpenAt(store.businessHours, store.timezone)) return;
    throw new AppException('STORE_CLOSED', 'The store is closed right now', HttpStatus.CONFLICT, {
      nextOpening: nextOpening(store.businessHours, store.timezone),
    });
  }

  private async resolvePayment(
    store: StoreWithHours,
    input: CreateOrderInput,
  ): Promise<PaymentSnapshot> {
    if (input.payment.type === 'CASH') {
      if (!store.cashEnabled) throw paymentError('Cash is not accepted');
      return {
        paymentMethodId: null,
        paymentMethodKind: 'CASH',
        paymentMethodLabel: store.locale.startsWith('en') ? 'Cash' : 'Efectivo',
      };
    }
    const method = await this.prisma.paymentMethod.findFirst({
      where: { id: input.payment.methodId, storeId: store.id, kind: 'TRANSFER', isActive: true },
      select: { id: true, label: true },
    });
    if (!method) throw paymentError('Payment method not found');
    return {
      paymentMethodId: method.id,
      paymentMethodKind: 'TRANSFER',
      paymentMethodLabel: method.label,
    };
  }
}

type StoreWithHours = Store & { businessHours: BusinessHour[] };

function paymentError(message: string): AppException {
  return new AppException('VALIDATION_ERROR', 'Invalid request', HttpStatus.BAD_REQUEST, {
    fields: [{ path: 'payment', message }],
  });
}
