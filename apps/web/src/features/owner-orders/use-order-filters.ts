import { useSearchParams } from 'react-router';

import { type OrderFilters, parseOrderFilters, toSearchParams } from './order-filters';

/** Filters live in the URL: refresh, back button and shared links keep them. */
export function useOrderFilters(): [OrderFilters, (patch: Partial<OrderFilters>) => void] {
  const [params, setParams] = useSearchParams();
  const filters = parseOrderFilters(params);

  const update = (patch: Partial<OrderFilters>) => {
    // Typing in the search box replaces the entry instead of filling the history.
    setParams(toSearchParams({ ...filters, ...patch }), { replace: 'q' in patch });
  };

  return [filters, update];
}
