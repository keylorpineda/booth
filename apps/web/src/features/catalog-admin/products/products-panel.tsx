import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { useProducts, useReorderProducts } from './api';
import { ProductRow } from './product-row';
import { useProductFilters } from './use-product-filters';
import { ErrorState } from '../../../components/feedback/error-state';
import { EmptyBagIllustration } from '../../../components/illustrations/empty-bag';
import { Button } from '../../../components/ui/button';
import { EmptyState } from '../../../components/ui/empty-state';
import { SearchInput } from '../../../components/ui/search-input';
import { Select } from '../../../components/ui/select';
import { Skeleton } from '../../../components/ui/skeleton';
import { useErrorMessage } from '../../../hooks/use-error-message';
import { moveItem } from '../../../lib/move-item';
import { useCanWrite } from '../../auth/use-can-write';
import { useOwnerStore } from '../../dashboard/api';
import { useOwnerMoney } from '../../dashboard/use-owner-money';
import { useCategories } from '../categories/api';

/** Every product in display order, with search, category filter and reorder. */
export function ProductsPanel() {
  const { t } = useTranslation();
  const errorMessage = useErrorMessage();
  const canWrite = useCanWrite();
  const [filters, setFilters] = useProductFilters();
  const products = useProducts(filters);
  const reorder = useReorderProducts(filters);
  const categories = useCategories().data ?? [];
  const currency = useOwnerStore().data?.currency;
  const formatMoney = useOwnerMoney();

  const list = products.data?.pages.flatMap((page) => page.data);
  const filtered = filters.q !== '' || filters.categoryId !== null;
  const categoryName = (id: string | null) => categories.find((c) => c.id === id)?.name ?? null;

  return (
    <section className="rounded-card border border-line bg-surface-raised p-5 shadow-card">
      <div className="flex flex-col gap-2 sm:flex-row">
        <SearchInput
          value={filters.q}
          onSearch={(q) => {
            setFilters({ q });
          }}
          label={t('catalog.products.search')}
          placeholder={t('catalog.products.searchPlaceholder')}
        />
        <Select
          aria-label={t('catalog.products.categoryFilter')}
          value={filters.categoryId ?? ''}
          onChange={(event) => {
            setFilters({ categoryId: event.target.value || null });
          }}
          className="h-11 sm:w-56"
        >
          <option value="">{t('catalog.products.allCategories')}</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </Select>
      </div>
      {filtered && list && list.length > 1 ? (
        <p className="mt-3 text-sm text-ink-muted">{t('catalog.products.reorderHint')}</p>
      ) : null}

      {products.error && !list ? (
        <ErrorState error={products.error} onRetry={() => void products.refetch()} />
      ) : !list || !currency ? (
        <div className="mt-4 flex flex-col gap-2">
          {[1, 2, 3, 4].map((key) => (
            <Skeleton key={key} className="h-16" />
          ))}
        </div>
      ) : list.length === 0 ? (
        <EmptyState
          illustration={<EmptyBagIllustration />}
          title={t(filtered ? 'catalog.products.noMatches' : 'catalog.products.empty')}
          description={t(
            filtered ? 'catalog.products.noMatchesHint' : 'catalog.products.emptyHint',
          )}
        />
      ) : (
        <ul className="mt-2 divide-y divide-line">
          {list.map((product, index) => (
            <ProductRow
              key={product.id}
              product={product}
              categoryName={categoryName(product.categoryId)}
              price={formatMoney(product.priceMinor, currency)}
              move={
                canWrite && !filtered
                  ? {
                      up: index > 0,
                      down: index < list.length - 1,
                      onMove: (delta) => {
                        reorder.mutate(moveItem(list, index, delta), {
                          onError: (error) => toast.error(errorMessage(error)),
                        });
                      },
                    }
                  : null
              }
            />
          ))}
        </ul>
      )}
      {products.hasNextPage ? (
        <Button
          variant="outline"
          className="mx-auto mt-3 flex"
          loading={products.isFetchingNextPage}
          onClick={() => void products.fetchNextPage()}
        >
          {t('orders.loadMore')}
        </Button>
      ) : null}
    </section>
  );
}
