import { createContext, type ReactNode, use, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { formatMoney, getFormattingLocale, type Tracking } from '@booth/shared';

interface TrackingContextValue {
  token: string;
  order: Tracking;
  formatPrice: (minor: number) => string;
}

const TrackingContext = createContext<TrackingContextValue | null>(null);

export function TrackingProvider({
  token,
  order,
  children,
}: {
  token: string;
  order: Tracking;
  children: ReactNode;
}) {
  const { i18n } = useTranslation();
  const value = useMemo(() => {
    const locale = getFormattingLocale(i18n.language, order.store.country);
    return {
      token,
      order,
      formatPrice: (minor: number) => formatMoney(minor, order.currency, locale),
    };
  }, [token, order, i18n.language]);

  return <TrackingContext value={value}>{children}</TrackingContext>;
}

export function useTracking(): TrackingContextValue {
  const value = use(TrackingContext);
  if (!value) throw new Error('useTracking must be used inside <TrackingProvider>');
  return value;
}
