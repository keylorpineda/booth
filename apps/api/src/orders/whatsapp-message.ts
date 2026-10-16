import {
  type AppLocale,
  formatMoney,
  getFormattingLocale,
  resolveAppLocale,
  toWhatsAppNumber,
} from '@booth/shared';

export interface OrderMessageInput {
  locale: string;
  country: string;
  currency: string;
  storeName: string;
  code: string;
  customerName: string;
  customerPhone: string;
  customerNote: string | null;
  lines: { name: string; quantity: number; lineTotalMinor: bigint }[];
  subtotalMinor: bigint;
  deliveryFeeMinor: bigint;
  totalMinor: bigint;
  fulfillment: 'PICKUP' | 'DELIVERY';
  deliveryZoneName: string | null;
  deliveryAddress: string | null;
  paymentLabel: string;
  trackingUrl: string;
}

const LABELS: Record<AppLocale, Record<string, string>> = {
  es: {
    title: 'Nuevo pedido',
    customer: 'Cliente',
    subtotal: 'Subtotal',
    delivery: 'Envío',
    total: 'Total',
    pickup: 'Retiro en tienda',
    deliveryTo: 'Entrega a domicilio',
    address: 'Dirección',
    payment: 'Pago',
    note: 'Nota',
    tracking: 'Seguimiento del pedido',
  },
  en: {
    title: 'New order',
    customer: 'Customer',
    subtotal: 'Subtotal',
    delivery: 'Delivery',
    total: 'Total',
    pickup: 'Pickup at the store',
    deliveryTo: 'Home delivery',
    address: 'Address',
    payment: 'Payment',
    note: 'Note',
    tracking: 'Order tracking',
  },
};

/** The text the customer sends to the store, in the store's language. */
export function buildOrderMessage(order: OrderMessageInput): string {
  const t = LABELS[resolveAppLocale(order.locale)];
  const formatLocale = getFormattingLocale(order.locale, order.country);
  const money = (minor: bigint) => formatMoney(Number(minor), order.currency, formatLocale);

  const delivery =
    order.fulfillment === 'DELIVERY'
      ? [
          `${t.deliveryTo} — ${order.deliveryZoneName ?? ''}`,
          order.deliveryAddress ? `${t.address}: ${order.deliveryAddress}` : null,
        ]
      : [t.pickup];

  return [
    `*${t.title} #${order.code}* — ${order.storeName}`,
    `${t.customer}: ${order.customerName} (${order.customerPhone})`,
    '',
    ...order.lines.map((line) => `${line.quantity} × ${line.name} — ${money(line.lineTotalMinor)}`),
    '',
    `${t.subtotal}: ${money(order.subtotalMinor)}`,
    order.fulfillment === 'DELIVERY' ? `${t.delivery}: ${money(order.deliveryFeeMinor)}` : null,
    `*${t.total}: ${money(order.totalMinor)}*`,
    '',
    ...delivery,
    `${t.payment}: ${order.paymentLabel}`,
    order.customerNote ? `${t.note}: ${order.customerNote}` : null,
    '',
    `${t.tracking}: ${order.trackingUrl}`,
  ]
    .filter((line): line is string => line !== null)
    .join('\n');
}

/** `wa.me` deep link. It cannot confirm the message was sent, so the order is saved first. */
export function whatsappUrl(storePhoneE164: string, message: string): string {
  return `https://wa.me/${toWhatsAppNumber(storePhoneE164)}?text=${encodeURIComponent(message)}`;
}
