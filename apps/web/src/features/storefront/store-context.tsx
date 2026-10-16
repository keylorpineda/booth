import { createContext, type ReactNode, use, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { formatMoney, getFormattingLocale, type PublicStore } from '@booth/shared';

interface StoreContextValue {
  slug: string;
  store: PublicStore;
  /** Formats minor units in the store currency and the customer's language. */
  formatPrice: (minor: number) => string;
}

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({ store, children }: { store: PublicStore; children: ReactNode }) {
  const { i18n } = useTranslation();
  const value = useMemo<StoreContextValue>(() => {
    const locale = getFormattingLocale(i18n.language, store.country);
    return {
      slug: store.slug,
      store,
      formatPrice: (minor) => formatMoney(minor, store.currency, locale),
    };
  }, [store, i18n.language]);

  return <StoreContext value={value}>{children}</StoreContext>;
}

export function useStoreContext(): StoreContextValue {
  const value = use(StoreContext);
  if (!value) throw new Error('useStoreContext must be used inside <StoreProvider>');
  return value;
}
