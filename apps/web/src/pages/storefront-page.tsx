import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router';

import { ErrorState } from '../components/feedback/error-state';
import { NotFoundState } from '../components/feedback/not-found-state';
import { WakingNotice } from '../components/feedback/waking-notice';
import { useCatalogQuery, useStoreQuery } from '../features/storefront/api';
import { StorefrontSkeleton } from '../features/storefront/components/storefront-skeleton';
import { StorefrontView } from '../features/storefront/components/storefront-view';
import { StoreProvider } from '../features/storefront/store-context';
import { ApiError } from '../lib/api-client';
import { getDomainInfo } from '../lib/domain';
import { applyStoreLocale } from '../lib/i18n';
import { useStoreTheme } from '../lib/theme';

export function StorefrontPage() {
  const { t } = useTranslation();
  const params = useParams();
  const domainInfo = getDomainInfo();
  const slug = params.slug ?? domainInfo.subdomain ?? '';
  const store = useStoreQuery(slug);
  const catalog = useCatalogQuery(slug);
  useStoreTheme(store.data?.brandColor, store.data?.brandForeground);

  useEffect(() => {
    if (store.data) applyStoreLocale(store.data.locale);
  }, [store.data]);

  const loading = store.isPending || catalog.isPending;

  if (store.error instanceof ApiError && store.error.status === 404) {
    return (
      <NotFoundState
        fullPage
        title={t('storefront.notFoundTitle')}
        description={t('storefront.notFoundDescription')}
      />
    );
  }

  const error = store.error ?? catalog.error;
  if (error) {
    return (
      <ErrorState
        error={error}
        onRetry={() => {
          void store.refetch();
          void catalog.refetch();
        }}
      />
    );
  }

  return (
    <>
      <WakingNotice loading={loading} />
      {store.data && catalog.data ? (
        <div className="min-h-dvh">
          <StoreProvider store={store.data}>
            <StorefrontView catalog={catalog.data} />
          </StoreProvider>
        </div>
      ) : (
        <StorefrontSkeleton />
      )}
    </>
  );
}
