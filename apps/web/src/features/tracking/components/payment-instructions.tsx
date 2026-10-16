import { ExternalLink } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { buttonVariants } from '../../../components/ui/button';
import { CopyButton } from '../../../components/ui/copy-button';
import { useTracking } from '../tracking-context';

/** How to pay by transfer, with the order code as the payment reference. */
export function PaymentInstructions() {
  const { t } = useTranslation();
  const { order, formatPrice } = useTracking();
  const { payment } = order;

  if (payment.kind === 'CASH') {
    return (
      <section className="rounded-card bg-surface-raised p-5 shadow-card">
        <h2 className="font-bold">{t('tracking.payment')}</h2>
        <p className="mt-1 text-ink-muted">
          {t('tracking.cashInstructions', { total: formatPrice(order.totalMinor) })}
        </p>
      </section>
    );
  }

  const rows = [
    { label: t('tracking.method'), value: payment.label, copy: false },
    payment.accountIdentifier
      ? { label: t('tracking.account'), value: payment.accountIdentifier, copy: true }
      : null,
    payment.accountHolder
      ? { label: t('tracking.holder'), value: payment.accountHolder, copy: false }
      : null,
    { label: t('tracking.amount'), value: formatPrice(order.totalMinor), copy: false },
    { label: t('tracking.reference'), value: order.code, copy: true },
  ].filter((row) => row !== null);

  return (
    <section className="rounded-card bg-surface-raised p-5 shadow-card">
      <h2 className="font-bold">{t('tracking.payment')}</h2>
      <dl className="mt-3 divide-y divide-line">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center gap-3 py-2">
            <dt className="w-28 shrink-0 text-sm text-ink-muted">{row.label}</dt>
            <dd className="flex-1 font-semibold tabular-nums">{row.value}</dd>
            {row.copy ? <CopyButton value={row.value} label={row.label} /> : null}
          </div>
        ))}
      </dl>
      {payment.instructions ? (
        <p className="mt-3 text-sm text-ink-muted">{payment.instructions}</p>
      ) : null}
      {payment.paymentUrl ? (
        <a
          href={payment.paymentUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonVariants({ variant: 'secondary', block: true, className: 'mt-4' })}
        >
          {t('tracking.payOnline')}
          <ExternalLink className="size-4" />
        </a>
      ) : null}
    </section>
  );
}
