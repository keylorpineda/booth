import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { useCategories, useCategoryMutations } from './api';
import { CategoryRow } from './category-row';
import { NewCategoryForm } from './new-category-form';
import { ErrorState } from '../../../components/feedback/error-state';
import { Skeleton } from '../../../components/ui/skeleton';
import { useErrorMessage } from '../../../hooks/use-error-message';
import { moveItem } from '../../../lib/move-item';

/** Categories become the tabs of the storefront, in this order. */
export function CategoriesPanel() {
  const { t } = useTranslation();
  const errorMessage = useErrorMessage();
  const categories = useCategories();
  const { reorder } = useCategoryMutations();

  if (categories.error) {
    return <ErrorState error={categories.error} onRetry={() => void categories.refetch()} />;
  }

  const list = categories.data;
  const move = (index: number, delta: -1 | 1) => {
    if (!list) return;
    reorder.mutate(moveItem(list, index, delta), {
      onError: (error) => toast.error(errorMessage(error)),
    });
  };

  return (
    <section className="rounded-card border border-line bg-surface-raised p-5 shadow-card">
      <p className="text-sm text-ink-muted">{t('catalog.categories.hint')}</p>
      <div className="mt-4">
        <NewCategoryForm />
      </div>
      {!list ? (
        <div className="mt-4 flex flex-col gap-2">
          {[1, 2, 3].map((key) => (
            <Skeleton key={key} className="h-14" />
          ))}
        </div>
      ) : list.length === 0 ? (
        <p className="mt-6 text-center text-sm text-ink-muted">{t('catalog.categories.empty')}</p>
      ) : (
        <ul className="mt-2 divide-y divide-line">
          {list.map((category, index) => (
            <CategoryRow
              key={category.id}
              category={category}
              isFirst={index === 0}
              isLast={index === list.length - 1}
              onMove={(delta) => {
                move(index, delta);
              }}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
