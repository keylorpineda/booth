import { type Fulfillment, type OrderStatus, type PaymentStatus } from '@booth/shared';

export interface DemoProductSeed {
  id: string;
  name: string;
  description: string;
  /** Major units (converted via `toMinor(price, currency)`). */
  price: number;
  trackStock: boolean;
  /** Stock before any active/completed demo orders reserve from it. */
  initialStock: number;
}

export interface DemoCategorySeed {
  name: string;
  products: readonly DemoProductSeed[];
}

export interface DemoZoneSeed {
  id: string;
  name: string;
  /** Major units (converted via `toMinor(fee, currency)`). */
  fee: number;
}

export interface DemoPaymentMethodSeed {
  id: string;
  preset: string;
  accountHolder: string;
  accountIdentifier: string;
}

export interface DemoHourSeed {
  weekday: number;
  opensAtMin: number;
  closesAtMin: number;
}

export interface DemoOrderLineSeed {
  productId: string;
  quantity: number;
}

export interface DemoOrderSeed {
  id: string;
  code: string;
  trackingToken: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  customerName: string;
  customerPhone: string;
  customerNote?: string;
  fulfillment: Fulfillment;
  deliveryZoneId?: string;
  deliveryAddress?: string;
  paymentMethodKind: 'CASH' | 'TRANSFER';
  paymentMethodId?: string;
  paymentMethodLabel: string;
  minutesAgo: number;
  lines: readonly DemoOrderLineSeed[];
  hasReceipt?: boolean;
}

export interface DemoStoreSeed {
  owner: {
    email: string;
    name: string;
    isDemo?: boolean;
  };
  store: {
    slug: string;
    name: string;
    description: string;
    whatsappPhone: string;
    brandColor: string;
    country: 'CR' | 'CO';
    locale: 'es' | 'en';
    acceptOrdersWhenClosed: boolean;
    orderExpirationMinutes: number;
    pickupEnabled: boolean;
    pickupAddress: string | null;
    deliveryEnabled: boolean;
    cashEnabled: boolean;
    pricesNote: string;
  };
  zones: readonly DemoZoneSeed[];
  paymentMethods: readonly DemoPaymentMethodSeed[];
  hours: readonly DemoHourSeed[];
  categories: readonly DemoCategorySeed[];
  orders: readonly DemoOrderSeed[];
}
