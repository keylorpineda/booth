import { AnimatePresence, m } from 'motion/react';
import { useTranslation } from 'react-i18next';

import { OrderRow } from './order-row';
import { ErrorState } from '../../../components/feedback/error-state';
import { EmptyBagIllustration } from '../../../components/illustrations/empty-bag';
import { Button } from '../../../components/ui/button';
import { EmptyState } from '../../../components/ui/empty-state';
import { Skeleton } from '../../../components/ui/skeleton';
import { useNow } from '../../../hooks/use-now';
import { useOwnerMoney } from '../../dashboard/use-owner-money';
import { useOwnerOrders } from '../api';
import { type OrderFilters } from '../order-filters';

/** Orders for the current filters, with "load more" and a refresh every 30 seconds. */
export function OrderList({ filters }: { filters: OrderFilters }) {
  const { t } = useTranslation();
  const query = useOwnerOrders(filters);
  const formatMoney = useOwnerMoney();
  const now = useNow(30_000);

  if (query.error && !query.data) {
    return <ErrorState error={query.error} onRetry={() => void query.refetch()} />;
  }
  if (!query.data) {
    return (
      <div className="flex flex-col gap-3" aria-busy="true">
        {[1, 2, 3].map((key) => (
          <Skeleton key={key} className="h-28 rounded-card" />
        ))}
      </div>
    );
  }

  const orders = query.data.pages.flatMap((page) => page.data);
  if (orders.length === 0) {
    const searching = filters.q !== '' || filters.payment !== null;
    return (
      <EmptyState
        illustration={<EmptyBagIllustration />}
        title={t(searching ? 'orders.noMatches' : `orders.empty.${filters.tab}`)}
        description={t(searching ? 'orders.noMatchesHint' : 'orders.emptyHint')}
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <ul className="flex flex-col gap-3" aria-live="polite">
        <AnimatePresence initial={false}>
          {orders.map((order) => (
            <m.li
              key={order.id}
              layout="position"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <OrderRow order={order} now={now} formatMoney={formatMoney} />
            </m.li>
          ))}
        </AnimatePresence>
      </ul>
      {query.hasNextPage ? (
        <Button
          variant="outline"
          className="self-center"
          loading={query.isFetchingNextPage}
          onClick={() => void query.fetchNextPage()}
        >
          {t('orders.loadMore')}
        </Button>
      ) : null}
    </div>
  );
}
