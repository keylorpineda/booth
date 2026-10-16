import { Search, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Input } from '../../../components/ui/input';
import { useDebouncedValue } from '../../../hooks/use-debounced-value';

interface OrderSearchProps {
  value: string;
  onSearch: (q: string) => void;
}

/** Search by code, name or phone; the URL updates once typing pauses. */
export function OrderSearch({ value, onSearch }: OrderSearchProps) {
  const { t } = useTranslation();
  const [text, setText] = useState(value);
  const debounced = useDebouncedValue(text.trim(), 350);

  // Re-runs on parent renders too; the guard keeps it from searching the same text twice.
  useEffect(() => {
    if (debounced !== value) onSearch(debounced);
  }, [debounced, value, onSearch]);

  return (
    <div className="relative min-w-0 flex-1">
      <Search
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-ink-subtle"
      />
      <Input
        type="search"
        inputMode="search"
        value={text}
        onChange={(event) => {
          setText(event.target.value);
        }}
        aria-label={t('orders.search')}
        placeholder={t('orders.searchPlaceholder')}
        className="h-11 pr-10 pl-11"
      />
      {text ? (
        <button
          type="button"
          aria-label={t('orders.clearSearch')}
          onClick={() => {
            setText('');
          }}
          className="absolute top-1/2 right-2 grid size-8 -translate-y-1/2 place-items-center rounded-full text-ink-muted hover:bg-surface-sunken"
        >
          <X className="size-4" />
        </button>
      ) : null}
    </div>
  );
}
