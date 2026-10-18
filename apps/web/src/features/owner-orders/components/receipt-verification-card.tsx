import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Copy,
  FileText,
  HelpCircle,
  Sparkles,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { type OwnerOrder } from '@booth/shared';

import { DetailCard } from './detail-card';
import { ReceiptVerificationBadge } from './receipt-verification-badge';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { useErrorMessage } from '../../../hooks/use-error-message';
import { cn } from '../../../lib/cn';
import { useCanWrite } from '../../auth/use-can-write';
import { canChangePayment } from '../order-actions';
import { useOrderActions } from '../use-order-actions';

interface ReceiptVerificationCardProps {
  order: OwnerOrder;
  formatMoney: (minor: number, currency: string) => string;
  actions?: Pick<ReturnType<typeof useOrderActions>, 'setPayment' | 'receiptUrl'>;
}

interface ContentProps extends ReceiptVerificationCardProps {
  actions: Pick<ReturnType<typeof useOrderActions>, 'setPayment' | 'receiptUrl'>;
}

function ReceiptVerificationCardContent({ order, formatMoney, actions }: ContentProps) {
  const { t } = useTranslation();
  const errorMessage = useErrorMessage();
  const canWrite = useCanWrite();
  const { setPayment, receiptUrl } = actions;
  const verification = order.receipt?.verification ?? null;
  const status = verification?.status ?? 'UNVERIFIED';

  const openReceipt = () => {
    const tab = window.open('', '_blank');
    receiptUrl.mutate(undefined, {
      onSuccess: ({ url }) => {
        if (tab) {
          tab.opener = null;
          tab.location.href = url;
        } else {
          window.location.assign(url);
        }
      },
      onError: (error) => {
        tab?.close();
        toast.error(errorMessage(error));
      },
    });
  };

  const confirmPayment = () => {
    setPayment.mutate('PAID', {
      onSuccess: () => toast.success(t('orders.receiptVerification.actions.paymentConfirmed')),
      onError: (error) => toast.error(errorMessage(error)),
    });
  };

  return (
    <DetailCard title={t('orders.receiptVerification.title')} icon={Sparkles}>
      <div className="flex flex-col gap-3.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold tracking-wider text-ink-muted uppercase">
            {t('orders.receiptVerification.aiBadge')}
          </span>
          <ReceiptVerificationBadge status={status} />
        </div>

        {/* Status explanation alert */}
        {!verification ? (
          <div className="rounded-card border border-line bg-surface-sunken p-3 text-xs text-ink-muted">
            {t('orders.receiptVerification.noVerification')}
          </div>
        ) : status === 'MATCHED' ? (
          <div className="flex items-start gap-2.5 rounded-card border border-success/30 bg-success/10 p-3 text-sm text-ink">
            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
            <div>
              <p className="font-semibold text-success">
                {t('orders.receiptVerification.status.MATCHED')}
              </p>
              <p className="mt-0.5 text-xs text-ink-muted">
                {t('orders.receiptVerification.statusDescription.MATCHED')}
              </p>
            </div>
          </div>
        ) : status === 'AMOUNT_MISMATCH' ? (
          <div className="flex items-start gap-2.5 rounded-card border border-warning/40 bg-warning/15 p-3 text-sm text-ink">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning-ink" />
            <div>
              <p className="font-semibold text-warning-ink">
                {t('orders.receiptVerification.status.AMOUNT_MISMATCH')}
              </p>
              <p className="mt-0.5 text-xs text-ink">
                {verification.mismatchReason ??
                  t('orders.receiptVerification.statusDescription.AMOUNT_MISMATCH')}
              </p>
            </div>
          </div>
        ) : status === 'DUPLICATE_REFERENCE' ? (
          <div className="flex items-start gap-2.5 rounded-card border border-danger/40 bg-danger/10 p-3 text-sm text-ink">
            <Copy className="mt-0.5 size-4 shrink-0 text-danger" />
            <div>
              <p className="font-semibold text-danger">
                {t('orders.receiptVerification.status.DUPLICATE_REFERENCE')}
              </p>
              <p className="mt-0.5 text-xs text-ink">
                {verification.mismatchReason ??
                  t('orders.receiptVerification.statusDescription.DUPLICATE_REFERENCE')}
              </p>
            </div>
          </div>
        ) : status === 'RECIPIENT_MISMATCH' ? (
          <div className="flex items-start gap-2.5 rounded-card border border-danger/40 bg-danger/10 p-3 text-sm text-ink">
            <AlertCircle className="mt-0.5 size-4 shrink-0 text-danger" />
            <div>
              <p className="font-semibold text-danger">
                {t('orders.receiptVerification.status.RECIPIENT_MISMATCH')}
              </p>
              <p className="mt-0.5 text-xs text-ink">
                {verification.mismatchReason ??
                  t('orders.receiptVerification.statusDescription.RECIPIENT_MISMATCH')}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-2.5 rounded-card border border-line bg-surface-sunken p-3 text-sm text-ink">
            <HelpCircle className="mt-0.5 size-4 shrink-0 text-ink-muted" />
            <div>
              <p className="font-semibold">{t('orders.receiptVerification.status.UNVERIFIED')}</p>
              <p className="mt-0.5 text-xs text-ink-muted">
                {verification.mismatchReason ??
                  t('orders.receiptVerification.statusDescription.UNVERIFIED')}
              </p>
            </div>
          </div>
        )}

        {/* Verification breakdown */}
        {verification ? (
          <dl className="flex flex-col divide-y divide-line/60 text-sm">
            <div className="flex items-center justify-between py-1.5">
              <dt className="text-ink-muted">
                {t('orders.receiptVerification.fields.detectedAmount')}
              </dt>
              <dd
                className={cn(
                  'font-semibold tabular-nums',
                  status === 'AMOUNT_MISMATCH' ? 'font-bold text-danger' : '',
                )}
              >
                {verification.extracted.amountMinor !== null
                  ? formatMoney(
                      verification.extracted.amountMinor,
                      verification.extracted.currency ?? order.currency,
                    )
                  : '—'}
              </dd>
            </div>

            <div className="flex items-center justify-between py-1.5">
              <dt className="text-ink-muted">
                {t('orders.receiptVerification.fields.expectedAmount')}
              </dt>
              <dd className="font-semibold tabular-nums">
                {formatMoney(order.totalMinor, order.currency)}
              </dd>
            </div>

            {verification.extracted.referenceNumber ? (
              <div className="flex items-center justify-between py-1.5">
                <dt className="text-ink-muted">
                  {t('orders.receiptVerification.fields.reference')}
                </dt>
                <dd className="font-mono text-xs font-semibold">
                  {verification.extracted.referenceNumber}
                </dd>
              </div>
            ) : null}

            {verification.extracted.bankName ? (
              <div className="flex items-center justify-between py-1.5">
                <dt className="text-ink-muted">{t('orders.receiptVerification.fields.bank')}</dt>
                <dd className="font-medium">{verification.extracted.bankName}</dd>
              </div>
            ) : null}

            {verification.extracted.recipientPhone ? (
              <div className="flex items-center justify-between py-1.5">
                <dt className="text-ink-muted">
                  {t('orders.receiptVerification.fields.recipientPhone')}
                </dt>
                <dd className="font-mono text-xs font-medium">
                  {verification.extracted.recipientPhone}
                </dd>
              </div>
            ) : null}

            {verification.extracted.recipientName ? (
              <div className="flex items-center justify-between py-1.5">
                <dt className="text-ink-muted">
                  {t('orders.receiptVerification.fields.recipientName')}
                </dt>
                <dd className="font-medium">{verification.extracted.recipientName}</dd>
              </div>
            ) : null}

            {verification.extracted.senderName ? (
              <div className="flex items-center justify-between py-1.5">
                <dt className="text-ink-muted">{t('orders.receiptVerification.fields.sender')}</dt>
                <dd className="font-medium">{verification.extracted.senderName}</dd>
              </div>
            ) : null}

            {verification.extracted.transactionDate ? (
              <div className="flex items-center justify-between py-1.5">
                <dt className="text-ink-muted">{t('orders.receiptVerification.fields.date')}</dt>
                <dd className="text-xs font-medium text-ink-muted">
                  {verification.extracted.transactionDate}
                </dd>
              </div>
            ) : null}

            <div className="flex items-center justify-between py-1.5">
              <dt className="text-ink-muted">{t('orders.receiptVerification.confidence.label')}</dt>
              <dd>
                <Badge
                  tone={
                    verification.confidence === 'HIGH'
                      ? 'success'
                      : verification.confidence === 'MEDIUM'
                        ? 'warning'
                        : 'neutral'
                  }
                >
                  {t(`orders.receiptVerification.confidence.${verification.confidence}`)}
                </Badge>
              </dd>
            </div>
          </dl>
        ) : null}

        {verification?.extracted.rawSummary ? (
          <p className="rounded-card bg-surface-sunken p-2.5 text-xs text-ink-muted italic">
            &ldquo;{verification.extracted.rawSummary}&rdquo;
          </p>
        ) : null}

        {/* Quick actions: view receipt image & one-click approve */}
        <div className="mt-1 flex flex-col gap-2 border-t border-line pt-3">
          <Button
            block
            variant="secondary"
            size="sm"
            loading={receiptUrl.isPending}
            onClick={openReceipt}
          >
            <FileText className="size-4" />
            {t('orders.receiptVerification.actions.viewReceipt')}
          </Button>

          {order.paymentStatus !== 'PAID' && canChangePayment(order) ? (
            <Button
              block
              variant="outline"
              size="sm"
              disabled={!canWrite}
              loading={setPayment.isPending}
              onClick={confirmPayment}
            >
              <CheckCircle2 className="size-4" />
              {t('orders.receiptVerification.actions.confirmPayment')}
            </Button>
          ) : order.paymentStatus === 'PAID' ? (
            <div className="flex items-center justify-center gap-1.5 py-1 text-xs font-semibold text-success">
              <CheckCircle2 className="size-4" />
              {t('orders.receiptVerification.actions.paymentConfirmed')}
            </div>
          ) : null}
        </div>
      </div>
    </DetailCard>
  );
}

function ConnectedReceiptVerificationCard({ order, formatMoney }: Omit<ContentProps, 'actions'>) {
  const actions = useOrderActions(order.id);
  return (
    <ReceiptVerificationCardContent order={order} formatMoney={formatMoney} actions={actions} />
  );
}

/** Card showing AI extraction details, status, discrepancies, and quick verification actions. */
export function ReceiptVerificationCard({
  order,
  formatMoney,
  actions,
}: ReceiptVerificationCardProps) {
  if (actions) {
    return (
      <ReceiptVerificationCardContent order={order} formatMoney={formatMoney} actions={actions} />
    );
  }
  return <ConnectedReceiptVerificationCard order={order} formatMoney={formatMoney} />;
}
