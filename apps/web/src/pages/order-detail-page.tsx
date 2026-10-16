import { ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useParams } from 'react-router';

import { ErrorState } from '../components/feedback/error-state';
import { StoreSignIllustration } from '../components/illustrations/store-sign';
import { buttonVariants } from '../components/ui/button';
import { EmptyState } from '../components/ui/empty-state';
import { Skeleton } from '../components/ui/skeleton';
import { useOwnerMoney } from '../features/dashboard/use-owner-money';
import { useOwnerOrder } from '../features/owner-orders/api';
import { CustomerCard } from '../features/owner-orders/components/customer-card';
import { FulfillmentCard } from '../features/owner-orders/components/fulfillment-card';
import { OrderItemsCard } from '../features/owner-orders/components/order-items-card';
import { OrderStatusBadge } from '../features/owner-orders/components/order-status-badge';
import { OrderTimeline } from '../features/owner-orders/components/order-timeline';
import { ApiError } from '../lib/api-client';

/** Everything about one order before acting on it. */
export function OrderDetailPage() {
  const { t, i18n } = useTranslation();
  const { id = '' } = useParams();
  const location = useLocation();
  const order = useOwnerOrder(id);
  const formatMoney = useOwnerMoney();

  // Back to the list with the filters it had (passed by the order row).
  const state = location.state as { listSearch?: string } | null;
  const back = (
    <Link
      to={`/dashboard/orders${state?.listSearch ?? ''}`}
      className={buttonVariants({ variant: 'ghost', size: 'sm', className: '-ml-3' })}
    >
      <ArrowLeft className="size-4" />
      {t('orders.detail.back')}
    </Link>
  );

  if (order.error instanceof ApiError && order.error.status === 404) {
    return (
      <div>
        <title>{`${t('orders.detail.notFound')} · Booth`}</title>
        {back}
        <EmptyState
          illustration={<StoreSignIllustration label="404" />}
          title={t('orders.detail.notFound')}
          description={t('orders.detail.notFoundHint')}
        />
      </div>
    );
  }
  if (order.error) return <ErrorState error={order.error} onRetry={() => void order.refetch()} />;
  if (!order.data) {
    return (
      <div className="flex flex-col gap-4">
        {back}
        <Skeleton className="h-12 w-48" />
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-64 rounded-card" />
          <Skeleton className="h-64 rounded-card" />
        </div>
      </div>
    );
  }

  const data = order.data;
  const placed = new Intl.DateTimeFormat(i18n.language, {
    dateStyle: 'full',
    timeStyle: 'short',
  }).format(new Date(data.createdAt));

  return (
    <div>
      <title>{`#${data.code} · ${t('dashboard.nav.orders')}`}</title>
      {back}
      <header className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
        <h1 className="font-mono text-2xl font-extrabold sm:text-3xl">#{data.code}</h1>
        <OrderStatusBadge status={data.status} />
        <p className="w-full text-sm text-ink-muted first-letter:uppercase">{placed}</p>
      </header>
      <div className="mt-6 grid gap-4 lg:grid-cols-[1.2fr_1fr] lg:items-start">
        <div className="flex flex-col gap-4">
          <OrderItemsCard order={data} formatMoney={formatMoney} />
          <OrderTimeline order={data} />
        </div>
        <div className="flex flex-col gap-4">
          <CustomerCard order={data} />
          <FulfillmentCard order={data} />
        </div>
      </div>
    </div>
  );
}
