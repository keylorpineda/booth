import { m } from 'motion/react';
import { useTranslation } from 'react-i18next';

import { useSampleMoney } from '../../use-sample-money';

/** Step 3: the customer uploads the transfer receipt; it is scanned and checked against the order. */
export function ReceiptScene() {
  const { t } = useTranslation();
  const money = useSampleMoney();

  return (
    <div className="flex h-full flex-col items-center justify-center gap-5 p-6">
      <div className="relative w-44 overflow-hidden rounded-xl border border-line bg-surface-raised p-4 shadow-card">
        <p className="text-xs text-ink-muted">{t('home.flow.transfer')}</p>
        <p className="mt-1 text-xl font-bold tabular-nums">{money(17)}</p>
        <div className="mt-3 space-y-1.5">
          <span className="block h-1.5 w-full rounded-full bg-line" />
          <span className="block h-1.5 w-3/4 rounded-full bg-line" />
          <span className="block h-1.5 w-1/2 rounded-full bg-line" />
        </div>
        {/* Scanning line sweeping over the receipt. */}
        <m.span
          aria-hidden="true"
          initial={{ top: '0%', opacity: 0 }}
          animate={{ top: ['0%', '100%'], opacity: [0, 1, 1, 0] }}
          transition={{ duration: 1.2, delay: 0.3, ease: 'easeInOut' }}
          className="absolute inset-x-0 h-0.5 bg-brand"
        />
      </div>
      <div className="flex items-center gap-2 text-sm font-semibold">
        <svg viewBox="0 0 24 24" className="size-6 shrink-0 text-success" aria-hidden="true">
          <m.circle
            cx="12"
            cy="12"
            r="10"
            fill="none"
            strokeWidth="2"
            stroke="currentColor"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.5, delay: 1.5 }}
          />
          <m.path
            d="M7.5 12.5l3 3 6-6.5"
            fill="none"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            stroke="currentColor"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.35, delay: 1.95 }}
          />
        </svg>
        <m.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.9 }}>
          {t('home.flow.matched')}
        </m.span>
      </div>
    </div>
  );
}
