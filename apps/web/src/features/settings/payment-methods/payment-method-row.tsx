import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { type PaymentMethod } from '@booth/shared';

import { usePaymentMethodMutations } from './api';
import { toPaymentMethodForm, toPaymentMethodInput } from './payment-method-form';
import { PaymentMethodFormView } from './payment-method-form-view';
import { ConfirmDialog } from '../../../components/ui/confirm-dialog';
import { Switch } from '../../../components/ui/switch';
import { useErrorMessage } from '../../../hooks/use-error-message';
import { cn } from '../../../lib/cn';
import { useCanWrite } from '../../auth/use-can-write';
import { CategoryRowActions } from '../../catalog-admin/categories/category-row-actions';

interface PaymentMethodRowProps {
  method: PaymentMethod;
  country: string;
  isFirst: boolean;
  isLast: boolean;
  onMove: (delta: -1 | 1) => void;
}

/** One transfer payment method row: label, details, active switch, reorder, edit and delete. */
export function PaymentMethodRow({
  method,
  country,
  isFirst,
  isLast,
  onMove,
}: PaymentMethodRowProps) {
  const { t } = useTranslation();
  const errorMessage = useErrorMessage();
  const canWrite = useCanWrite();
  const { update, remove } = usePaymentMethodMutations();
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const summary = [method.accountIdentifier, method.accountHolder].filter(Boolean).join(' · ');

  return (
    <li className="py-3">
      {editing ? (
        <div className="rounded-card border border-line bg-surface p-4">
          <PaymentMethodFormView
            country={country}
            defaultValues={toPaymentMethodForm(method)}
            saving={update.isPending}
            submitLabel={t('settings.save')}
            onCancel={() => {
              setEditing(false);
            }}
            onSubmit={(values) => {
              update.mutate(
                { id: method.id, ...toPaymentMethodInput(values, method.isActive) },
                {
                  onSuccess: () => {
                    setEditing(false);
                    toast.success(t('settings.saved'));
                  },
                  onError: (error) => toast.error(errorMessage(error)),
                },
              );
            }}
          />
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <div className="min-w-0 flex-1">
            <p className={cn('truncate font-semibold', !method.isActive && 'text-ink-muted')}>
              {method.label}
            </p>
            <p className="truncate text-sm text-ink-muted">
              {(summary || method.paymentUrl) ?? t('settings.payments.noDetails')}
              {method.isActive ? '' : ` · ${t('catalog.categories.hidden')}`}
            </p>
          </div>
          <Switch
            checked={method.isActive}
            disabled={!canWrite || update.isPending}
            aria-label={t('settings.payments.visible', { name: method.label })}
            onCheckedChange={(isActive) => {
              update.mutate(
                { id: method.id, isActive },
                { onError: (error) => toast.error(errorMessage(error)) },
              );
            }}
          />
          <CategoryRowActions
            name={method.label}
            disabled={!canWrite}
            isFirst={isFirst}
            isLast={isLast}
            onMove={onMove}
            onRename={() => {
              setEditing(true);
            }}
            onDelete={() => {
              setConfirmDelete(true);
            }}
          />
        </div>
      )}
      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title={t('settings.payments.deleteTitle', { name: method.label })}
        description={t('settings.payments.deleteText')}
        confirmLabel={t('settings.payments.deleteConfirm')}
        destructive
        loading={remove.isPending}
        onConfirm={() => {
          remove.mutate(method.id, {
            onSuccess: () => {
              setConfirmDelete(false);
              toast.success(t('settings.payments.deleted', { name: method.label }));
            },
            onError: (error) => toast.error(errorMessage(error)),
          });
        }}
      />
    </li>
  );
}
