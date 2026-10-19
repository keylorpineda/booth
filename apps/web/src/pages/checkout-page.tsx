import { useEffect } from 'react';
import { useParams } from 'react-router';

import { ErrorState } from '../components/feedback/error-state';
import { WakingNotice } from '../components/feedback/waking-notice';
import { Skeleton } from '../components/ui/skeleton';
import { CheckoutView } from '../features/checkout/components/checkout-view';
import { useCatalogQuery, useStoreQuery } from '../features/storefront/api';
import { StoreProvider } from '../features/storefront/store-context';
import { getDomainInfo } from '../lib/domain';
import { applyStoreLocale } from '../lib/i18n';
import { useStoreTheme } from '../lib/theme';

export function CheckoutPage() {
  const params = useParams();
  const domainInfo = getDomainInfo();
  const slug = params.slug ?? domainInfo.subdomain ?? '';
  const store = useStoreQuery(slug);
  const catalog = useCatalogQuery(slug);
  useStoreTheme(store.data?.brandColor, store.data?.brandForeground);

  useEffect(() => {
    if (store.data) applyStoreLocale(store.data.locale);
  }, [store.data]);

  const error = store.error ?? catalog.error;
  if (error) return <ErrorState error={error} onRetry={() => void store.refetch()} />;

  if (!store.data || !catalog.data) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col gap-4 px-4 pt-16">
        <WakingNotice loading />
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-40 rounded-card" />
        ))}
      </div>
    );
  }

  return (
    <div className="min-h-dvh">
      <title>{`${store.data.name} · Checkout`}</title>
      <StoreProvider store={store.data}>
        <CheckoutView catalog={catalog.data} />
      </StoreProvider>
    </div>
  );
}
