import { CircleCheck, FileText } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { type PaymentStatus } from '@booth/shared';

import { Badge } from '../../../components/ui/badge';

/** Paid, receipt to review, or unpaid (shown only for transfers: cash is paid on delivery). */
export function PaymentBadge({ status, cash }: { status: PaymentStatus; cash: boolean }) {
  const { t } = useTranslation();

  if (status === 'PAID') {
    return (
      <Badge tone="success">
        <CircleCheck className="size-3.5" />
        {t('orders.payment.PAID')}
      </Badge>
    );
  }
  if (status === 'RECEIPT_SUBMITTED') {
    return (
      <Badge tone="brand">
        <FileText className="size-3.5" />
        {t('orders.payment.RECEIPT_SUBMITTED')}
      </Badge>
    );
  }
  return cash ? (
    <Badge>{t('orders.payment.cash')}</Badge>
  ) : (
    <Badge tone="warning">{t('orders.payment.UNPAID')}</Badge>
  );
}
