import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { type OrderStatus, type OwnerOrder } from '@booth/shared';

import { Button } from '../../../components/ui/button';
import { ConfirmDialog } from '../../../components/ui/confirm-dialog';
import { useErrorMessage } from '../../../hooks/use-error-message';
import { useCanWrite } from '../../auth/use-can-write';
import { statusActions } from '../order-actions';
import { type useOrderActions } from '../use-order-actions';

interface StatusActionsProps {
  order: OwnerOrder;
  mutation: ReturnType<typeof useOrderActions>['changeStatus'];
}

/** Only valid next steps (ORDER_TRANSITIONS); cancelling asks first because it frees the stock. */
export function StatusActions({ order, mutation }: StatusActionsProps) {
  const { t } = useTranslation();
  const errorMessage = useErrorMessage();
  const canWrite = useCanWrite();
  const [confirmCancel, setConfirmCancel] = useState(false);
  const { forward, canCancel } = statusActions(order.status);
  if (forward.length === 0 && !canCancel) return null;

  const change = (status: OrderStatus) => {
    mutation.mutate(status, {
      onSuccess: () => {
        setConfirmCancel(false);
        toast.success(t('orders.actions.statusChanged', { status: t(`orders.status.${status}`) }));
      },
      onError: (error) => toast.error(errorMessage(error)),
    });
  };
  const busy = (status: OrderStatus) => mutation.isPending && mutation.variables === status;

  return (
    <div className="flex flex-col gap-2">
      {forward.map((status, index) => (
        <Button
          key={status}
          block
          variant={index === 0 ? 'primary' : 'outline'}
          disabled={!canWrite || mutation.isPending}
          loading={busy(status)}
          onClick={() => {
            change(status);
          }}
        >
          {t(`orders.actions.to.${status}`)}
        </Button>
      ))}
      {canCancel ? (
        <Button
          block
          variant="ghost"
          className="text-danger"
          disabled={!canWrite || mutation.isPending}
          onClick={() => {
            setConfirmCancel(true);
          }}
        >
          {t('orders.actions.cancel')}
        </Button>
      ) : null}
      <ConfirmDialog
        open={confirmCancel}
        onOpenChange={setConfirmCancel}
        title={t('orders.actions.cancelTitle', { code: order.code })}
        description={t('orders.actions.cancelText')}
        confirmLabel={t('orders.actions.cancelConfirm')}
        destructive
        loading={busy('CANCELLED')}
        onConfirm={() => {
          change('CANCELLED');
        }}
      />
    </div>
  );
}
