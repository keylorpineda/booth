import { type OwnerOrder, type OwnerOrderSummary } from '@booth/shared';

import {
  type Order,
  type OrderItem,
  type OrderStatusEvent,
  type PaymentReceipt,
} from '../../generated/prisma/client';

type OrderForSummary = Order & {
  receipt: Pick<PaymentReceipt, 'id'> | null;
  _count: { items: number };
};

type OrderForDetail = Order & {
  items: OrderItem[];
  events: OrderStatusEvent[];
  receipt: PaymentReceipt | null;
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
      receipt: order.receipt ? { id: order.receipt.id } : null,
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
        }
      : null,
    trackingToken: order.trackingToken,
    privacyConsentAt: order.privacyConsentAt.toISOString(),
  };
}
