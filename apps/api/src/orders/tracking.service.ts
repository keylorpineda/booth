import { HttpStatus, Inject, Injectable, Logger, Optional } from '@nestjs/common';

import { readableForeground, type Tracking } from '@booth/shared';

import { OrderExpirationService } from './order-expiration.service';
import { AppException } from '../common/errors/app.exception';
import { notFound } from '../common/errors/not-found';
import { type ReceiptType } from '../media/image-file';
import { MEDIA_STORAGE, type MediaStorage } from '../media/media-storage';
import { PrismaService } from '../prisma/prisma.service';
import { ReceiptVerificationService } from '../receipts/receipt-verification.service';

const OPEN_STATUSES = new Set(['PENDING', 'CONFIRMED', 'PREPARING', 'READY']);

const trackingInclude = {
  store: true,
  items: { orderBy: { id: 'asc' } },
  events: { orderBy: { createdAt: 'asc' } },
  receipt: true,
  paymentMethod: true,
} as const;

/** Public order view by unguessable token. The short order code never grants access. */
@Injectable()
export class TrackingService {
  private readonly logger = new Logger(TrackingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly expiration: OrderExpirationService,
    @Inject(MEDIA_STORAGE) private readonly storage: MediaStorage,
    @Optional() private readonly receiptVerification?: ReceiptVerificationService,
  ) {}

  async get(token: string): Promise<Tracking> {
    return this.toDto(await this.load(token));
  }

  /** Stores the receipt privately, marks the payment as submitted and pauses expiration. */
  async uploadReceipt(token: string, file: Buffer, format: ReceiptType): Promise<Tracking> {
    const order = await this.load(token);
    if (!canUploadReceipt(order)) {
      throw new AppException(
        'ORDER_NOT_PAYABLE',
        'This order does not accept a receipt',
        HttpStatus.CONFLICT,
      );
    }

    const stored = await this.storage.uploadPrivate(
      file,
      `booth/${order.storeId}/receipts`,
      format,
    );
    const receiptId = await this.prisma.$transaction(async (tx) => {
      // Conditional: if the order expired or was cancelled meanwhile, nothing changes.
      const { count } = await tx.order.updateMany({
        where: {
          id: order.id,
          status: { in: ['PENDING', 'CONFIRMED', 'PREPARING', 'READY'] },
          paymentStatus: { not: 'PAID' },
        },
        data: { paymentStatus: 'RECEIPT_SUBMITTED', expiresAt: null },
      });
      if (count === 0) return null;
      const receipt = await tx.paymentReceipt.upsert({
        where: { orderId: order.id },
        create: {
          orderId: order.id,
          publicId: stored.publicId,
          mimeType: format,
          bytes: stored.bytes,
        },
        update: {
          publicId: stored.publicId,
          mimeType: format,
          bytes: stored.bytes,
          uploadedAt: new Date(),
        },
      });
      return receipt.id;
    });

    if (!receiptId) {
      await this.storage.deletePrivate(stored.publicId);
      throw new AppException(
        'ORDER_NOT_PAYABLE',
        'This order does not accept a receipt',
        HttpStatus.CONFLICT,
      );
    }
    if (order.receipt) await this.storage.deletePrivate(order.receipt.publicId);

    if (this.receiptVerification) {
      try {
        await this.receiptVerification.verifyReceipt(order.id, receiptId, file, format);
      } catch (error) {
        this.logger.warn(
          `AI receipt verification skipped due to error: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }

    return this.get(token);
  }

  private async load(token: string) {
    const order = await this.prisma.order.findUnique({
      where: { trackingToken: token },
      include: trackingInclude,
    });
    if (!order) throw notFound('Order');

    // Lazy expiry: the scheduled job may not have run while the free instance slept.
    if (order.status === 'PENDING' && order.expiresAt && order.expiresAt < new Date()) {
      await this.expiration.expireStale(order.storeId);
      return this.prisma.order.findUniqueOrThrow({
        where: { id: order.id },
        include: trackingInclude,
      });
    }
    return order;
  }

  private toDto(order: Awaited<ReturnType<TrackingService['load']>>): Tracking {
    const method = order.paymentMethodKind === 'TRANSFER' ? order.paymentMethod : null;
    return {
      code: order.code,
      status: order.status,
      paymentStatus: order.paymentStatus,
      createdAt: order.createdAt.toISOString(),
      expiresAt: order.expiresAt?.toISOString() ?? null,
      store: {
        slug: order.store.slug,
        name: order.store.name,
        logoUrl: order.store.logoPublicId
          ? this.storage.imageUrls(order.store.logoPublicId).thumb
          : null,
        brandColor: order.store.brandColor,
        brandForeground: readableForeground(order.store.brandColor),
        whatsappPhone: order.store.whatsappPhone,
        locale: order.store.locale,
        country: order.store.country,
      },
      currency: order.currency,
      // Snapshots from the order, never current product data.
      lines: order.items.map((item) => ({
        name: item.productName,
        unitPriceMinor: Number(item.unitPriceMinor),
        quantity: item.quantity,
        lineTotalMinor: Number(item.lineTotalMinor),
      })),
      subtotalMinor: Number(order.subtotalMinor),
      deliveryFeeMinor: Number(order.deliveryFeeMinor),
      totalMinor: Number(order.totalMinor),
      fulfillment: order.fulfillment,
      deliveryZoneName: order.deliveryZoneName,
      payment: {
        kind: order.paymentMethodKind,
        label: order.paymentMethodLabel,
        accountHolder: method?.accountHolder ?? null,
        accountIdentifier: method?.accountIdentifier ?? null,
        instructions: method?.instructions ?? null,
        paymentUrl: method?.paymentUrl ?? null,
      },
      timeline: order.events.map((event) => ({
        status: event.status,
        at: event.createdAt.toISOString(),
      })),
      receipt: order.receipt ? { uploadedAt: order.receipt.uploadedAt.toISOString() } : null,
      canUploadReceipt: canUploadReceipt(order),
    };
  }
}

function canUploadReceipt(order: {
  status: string;
  paymentStatus: string;
  paymentMethodKind: string;
}): boolean {
  return (
    order.paymentMethodKind === 'TRANSFER' &&
    order.paymentStatus !== 'PAID' &&
    OPEN_STATUSES.has(order.status)
  );
}
