import { CircleCheck, FileText, Undo2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { type OwnerOrder } from '@booth/shared';

import { Button } from '../../../components/ui/button';
import { useErrorMessage } from '../../../hooks/use-error-message';
import { useCanWrite } from '../../auth/use-can-write';
import { canChangePayment } from '../order-actions';
import { type useOrderActions } from '../use-order-actions';

interface PaymentActionsProps {
  order: OwnerOrder;
  actions: Pick<ReturnType<typeof useOrderActions>, 'setPayment' | 'receiptUrl'>;
}

/** View the receipt (signed, short-lived link) and mark the order paid or unpaid. */
export function PaymentActions({ order, actions }: PaymentActionsProps) {
  const { t } = useTranslation();
  const errorMessage = useErrorMessage();
  const canWrite = useCanWrite();
  const { setPayment, receiptUrl } = actions;
  const paid = order.paymentStatus === 'PAID';

  const openReceipt = () => {
    // Opened before the request so the browser does not block it as a popup.
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

  const togglePaid = () => {
    setPayment.mutate(paid ? 'UNPAID' : 'PAID', {
      onSuccess: (updated) => toast.success(t(`orders.actions.payment.${updated.paymentStatus}`)),
      onError: (error) => toast.error(errorMessage(error)),
    });
  };

  return (
    <div className="flex flex-col gap-2">
      {order.receipt ? (
        <Button block variant="secondary" loading={receiptUrl.isPending} onClick={openReceipt}>
          <FileText className="size-4" />
          {t('orders.actions.viewReceipt')}
        </Button>
      ) : null}
      {canChangePayment(order) ? (
        <Button
          block
          variant={paid ? 'ghost' : 'outline'}
          disabled={!canWrite}
          loading={setPayment.isPending}
          onClick={togglePaid}
        >
          {paid ? <Undo2 className="size-4" /> : <CircleCheck className="size-4" />}
          {t(paid ? 'orders.actions.markUnpaid' : 'orders.actions.markPaid')}
        </Button>
      ) : null}
    </div>
  );
}
