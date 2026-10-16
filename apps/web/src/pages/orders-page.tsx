import { useTranslation } from 'react-i18next';

import { TabPanel, Tabs } from '../components/ui/tabs';
import { OrderList } from '../features/owner-orders/components/order-list';
import { OrderSearch } from '../features/owner-orders/components/order-search';
import { PaymentFilter } from '../features/owner-orders/components/payment-filter';
import { ORDER_TABS } from '../features/owner-orders/order-filters';
import { useOrderFilters } from '../features/owner-orders/use-order-filters';

/** Owner orders: what needs attention first (active), with search and a payment filter. */
export function OrdersPage() {
  const { t } = useTranslation();
  const [filters, setFilters] = useOrderFilters();

  return (
    <div>
      <title>{`${t('dashboard.nav.orders')} · Booth`}</title>
      <h1 className="text-2xl font-extrabold sm:text-3xl">{t('dashboard.nav.orders')}</h1>
      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
        <OrderSearch
          value={filters.q}
          onSearch={(q) => {
            setFilters({ q });
          }}
        />
        <PaymentFilter
          value={filters.payment}
          onChange={(payment) => {
            setFilters({ payment });
          }}
        />
      </div>
      <Tabs
        className="mt-4"
        value={filters.tab}
        onValueChange={(tab) => {
          setFilters({ tab });
        }}
        tabs={ORDER_TABS.map((tab) => ({ value: tab, label: t(`orders.tabs.${tab}`) }))}
      >
        <TabPanel value={filters.tab}>
          <OrderList filters={filters} />
        </TabPanel>
      </Tabs>
    </div>
  );
}
