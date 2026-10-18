import { AlertCircle, AlertTriangle, Copy, HelpCircle, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { type ReceiptVerificationStatus } from '@booth/shared';

import { Badge } from '../../../components/ui/badge';

interface ReceiptVerificationBadgeProps {
  status: ReceiptVerificationStatus | null | undefined;
  className?: string;
  showIcon?: boolean;
}

/** Visual indicator for AI voucher verification outcome. */
export function ReceiptVerificationBadge({
  status,
  className,
  showIcon = true,
}: ReceiptVerificationBadgeProps) {
  const { t } = useTranslation();

  if (!status) return null;

  switch (status) {
    case 'MATCHED':
      return (
        <Badge tone="success" className={className}>
          {showIcon ? <Sparkles className="size-3.5" /> : null}
          {t('orders.receiptVerification.status.MATCHED')}
        </Badge>
      );
    case 'AMOUNT_MISMATCH':
      return (
        <Badge tone="warning" className={className}>
          {showIcon ? <AlertTriangle className="size-3.5" /> : null}
          {t('orders.receiptVerification.status.AMOUNT_MISMATCH')}
        </Badge>
      );
    case 'DUPLICATE_REFERENCE':
      return (
        <Badge tone="danger" className={className}>
          {showIcon ? <Copy className="size-3.5" /> : null}
          {t('orders.receiptVerification.status.DUPLICATE_REFERENCE')}
        </Badge>
      );
    case 'RECIPIENT_MISMATCH':
      return (
        <Badge tone="danger" className={className}>
          {showIcon ? <AlertCircle className="size-3.5" /> : null}
          {t('orders.receiptVerification.status.RECIPIENT_MISMATCH')}
        </Badge>
      );
    case 'UNVERIFIED':
      return (
        <Badge tone="neutral" className={className}>
          {showIcon ? <HelpCircle className="size-3.5" /> : null}
          {t('orders.receiptVerification.status.UNVERIFIED')}
        </Badge>
      );
    default:
      return null;
  }
}
