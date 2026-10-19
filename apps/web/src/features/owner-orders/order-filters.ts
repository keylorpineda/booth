import { ACTIVE_ORDER_STATUSES, type OrderStatus, type PaymentStatus } from '@booth/shared';

export const ORDER_TABS = ['active', 'completed', 'closed', 'all'] as const;
export type OrderTab = (typeof ORDER_TABS)[number];

export const PAYMENT_FILTERS = ['UNPAID', 'RECEIPT_SUBMITTED', 'PAID'] as const;

export interface OrderFilters {
  tab: OrderTab;
  payment: PaymentStatus | null;
  q: string;
}

const TAB_STATUSES: Record<OrderTab, readonly OrderStatus[] | null> = {
  active: ACTIVE_ORDER_STATUSES,
  completed: ['COMPLETED'],
  closed: ['CANCELLED', 'EXPIRED'],
  all: null,
};

/** Reads the filters from the URL; unknown values fall back to the defaults (active, any). */
export function parseOrderFilters(params: URLSearchParams): OrderFilters {
  const tab = params.get('tab');
  const payment = params.get('payment');
  return {
    tab: ORDER_TABS.find((value) => value === tab) ?? 'active',
    payment: PAYMENT_FILTERS.find((value) => value === payment) ?? null,
    q: params.get('q')?.trim() ?? '',
  };
}

/** The URL keeps only non-default values, so a shared link stays short. */
export function toSearchParams(filters: OrderFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.tab !== 'active') params.set('tab', filters.tab);
  if (filters.payment) params.set('payment', filters.payment);
  if (filters.q) params.set('q', filters.q);
  return params;
}

/** Query string for `GET /api/me/orders`. */
export function toApiQuery(filters: OrderFilters, cursor?: string): string {
  const params = new URLSearchParams();
  const statuses = TAB_STATUSES[filters.tab];
  if (statuses) params.set('status', statuses.join(','));
  if (filters.payment) params.set('paymentStatus', filters.payment);
  if (filters.q) params.set('q', filters.q);
  if (cursor) params.set('cursor', cursor);
  return params.toString();
}
