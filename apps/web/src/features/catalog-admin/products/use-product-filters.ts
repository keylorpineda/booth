import { useSearchParams } from 'react-router';

import { type ProductFilters } from './api';

/** `?category=` (empty) means no filter, like a missing param. */
const emptyToNull = (value: string | null) => (value === '' ? null : value);

/** Product search and category filter live in the URL, next to the catalog tab. */
export function useProductFilters(): [ProductFilters, (patch: Partial<ProductFilters>) => void] {
  const [params, setParams] = useSearchParams();
  const filters: ProductFilters = {
    q: params.get('q')?.trim() ?? '',
    categoryId: emptyToNull(params.get('category')),
  };

  const update = (patch: Partial<ProductFilters>) => {
    const next = { ...filters, ...patch };
    setParams(
      (current) => {
        const params = new URLSearchParams(current);
        if (next.q) params.set('q', next.q);
        else params.delete('q');
        if (next.categoryId) params.set('category', next.categoryId);
        else params.delete('category');
        return params;
      },
      { replace: 'q' in patch },
    );
  };

  return [filters, update];
}
