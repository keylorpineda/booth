import {
  type OwnerOrder,
  type OwnerOrderSummary,
  type ReceiptConfidence,
  type ReceiptVerificationStatus,
} from '@booth/shared';

import {
  type Order,
  type OrderItem,
  type OrderStatusEvent,
  type PaymentReceipt,
  type ReceiptVerification,
} from '../../generated/prisma/client';

type OrderForSummary = Order & {
  receipt: { id: string; verification: { status: ReceiptVerificationStatus } | null } | null;
  _count: { items: number };
};

type OrderForDetail = Order & {
  items: OrderItem[];
  events: OrderStatusEvent[];
  receipt: (PaymentReceipt & { verification: ReceiptVerification | null }) | null;
};

/** Owner list row. Money leaves the API as JSON numbers of minor units. */
export function toOwnerOrderSummary(order: OrderForSummary): OwnerOrderSummary {
  return {
    id: order.id,
    code: order.code,
    status: order.status,
    paymentStatus: order.paymentStatus,
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    fulfillment: order.fulfillment,
    paymentMethodKind: order.paymentMethodKind,
    paymentMethodLabel: order.paymentMethodLabel,
    currency: order.currency,
    totalMinor: Number(order.totalMinor),
    itemCount: order._count.items,
    hasReceipt: order.receipt !== null,
    receiptVerificationStatus: order.receipt?.verification?.status ?? null,
    expiresAt: order.expiresAt?.toISOString() ?? null,
    createdAt: order.createdAt.toISOString(),
  };
}

/** Owner detail: customer data, snapshot lines, timeline and receipt metadata. */
export function toOwnerOrder(order: OrderForDetail): OwnerOrder {
  return {
    ...toOwnerOrderSummary({
      ...order,
      _count: { items: order.items.length },
      receipt: order.receipt
        ? {
            id: order.receipt.id,
            verification: order.receipt.verification
              ? { status: order.receipt.verification.status }
              : null,
          }
        : null,
    }),
    customerNote: order.customerNote,
    deliveryZoneName: order.deliveryZoneName,
    deliveryAddress: order.deliveryAddress,
    subtotalMinor: Number(order.subtotalMinor),
    deliveryFeeMinor: Number(order.deliveryFeeMinor),
    items: order.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      name: item.productName,
      unitPriceMinor: Number(item.unitPriceMinor),
      quantity: item.quantity,
      lineTotalMinor: Number(item.lineTotalMinor),
    })),
    events: order.events.map((event) => ({
      status: event.status,
      actor: event.actor,
      note: event.note,
      at: event.createdAt.toISOString(),
    })),
    receipt: order.receipt
      ? {
          mimeType: order.receipt.mimeType,
          bytes: order.receipt.bytes,
          uploadedAt: order.receipt.uploadedAt.toISOString(),
          verification: order.receipt.verification
            ? {
                status: order.receipt.verification.status,
                confidence: order.receipt.verification.confidence as ReceiptConfidence,
                extracted: {
                  amountMinor:
                    order.receipt.verification.extractedAmountMinor !== null
                      ? Number(order.receipt.verification.extractedAmountMinor)
                      : null,
                  currency: order.receipt.verification.extractedCurrency,
                  recipientPhone: order.receipt.verification.recipientPhone,
                  recipientName: order.receipt.verification.recipientName,
                  senderName: order.receipt.verification.senderName,
                  transactionDate: order.receipt.verification.transactionDate,
                  referenceNumber: order.receipt.verification.referenceNumber,
                  bankName: order.receipt.verification.bankName,
                  confidence: order.receipt.verification.confidence as ReceiptConfidence,
                  rawSummary: order.receipt.verification.rawSummary,
                },
                mismatchReason: order.receipt.verification.rejectionReason,
                verifiedAt: order.receipt.verification.verifiedAt.toISOString(),
              }
            : null,
        }
      : null,
    trackingToken: order.trackingToken,
    privacyConsentAt: order.privacyConsentAt.toISOString(),
  };
}
