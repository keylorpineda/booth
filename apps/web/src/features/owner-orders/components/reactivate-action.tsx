import { RotateCcw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { type OwnerOrder } from '@booth/shared';

import { FormAlert } from '../../../components/feedback/form-alert';
import { Button } from '../../../components/ui/button';
import { useErrorMessage } from '../../../hooks/use-error-message';
import { useCanWrite } from '../../auth/use-can-write';
import { soldOutItems } from '../order-actions';
import { type useOrderActions } from '../use-order-actions';

interface ReactivateActionProps {
  order: OwnerOrder;
  mutation: ReturnType<typeof useOrderActions>['reactivate'];
}

/** Expired -> pending with a new window; names the products that sold out meanwhile. */
export function ReactivateAction({ order, mutation }: ReactivateActionProps) {
  const { t } = useTranslation();
  const errorMessage = useErrorMessage();
  const canWrite = useCanWrite();
  if (order.status !== 'EXPIRED') return null;

  const soldOut = soldOutItems(mutation.error, order);
  const message =
    soldOut.length > 0
      ? t('orders.actions.reactivateSoldOut', { items: soldOut.join(', ') })
      : mutation.error
        ? errorMessage(mutation.error)
        : null;

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm text-ink-muted">{t('orders.actions.expiredHint')}</p>
      <FormAlert message={message} />
      <Button
        block
        disabled={!canWrite}
        loading={mutation.isPending}
        onClick={() => {
          mutation.mutate(undefined, {
            onSuccess: () => toast.success(t('orders.actions.reactivated')),
          });
        }}
      >
        <RotateCcw className="size-4" />
        {t('orders.actions.reactivate')}
      </Button>
    </div>
  );
}
