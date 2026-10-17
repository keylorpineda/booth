import { useTranslation } from 'react-i18next';

import { SearchInput } from '../../../components/ui/search-input';

interface OrderSearchProps {
  value: string;
  onSearch: (q: string) => void;
}

/** Search by code, name or phone; the URL updates once typing pauses. */
export function OrderSearch({ value, onSearch }: OrderSearchProps) {
  const { t } = useTranslation();
  return (
    <SearchInput
      value={value}
      onSearch={onSearch}
      label={t('orders.search')}
      placeholder={t('orders.searchPlaceholder')}
    />
  );
}
