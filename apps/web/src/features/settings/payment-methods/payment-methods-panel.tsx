import { Plus } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { presetsForCountry, type Store } from '@booth/shared';

import { usePaymentMethodMutations, usePaymentMethods } from './api';
import { emptyPaymentMethodForm, toPaymentMethodInput } from './payment-method-form';
import { PaymentMethodFormView } from './payment-method-form-view';
import { PaymentMethodRow } from './payment-method-row';
import { ErrorState } from '../../../components/feedback/error-state';
import { Button } from '../../../components/ui/button';
import { Skeleton } from '../../../components/ui/skeleton';
import { SwitchField } from '../../../components/ui/switch-field';
import { useErrorMessage } from '../../../hooks/use-error-message';
import { moveItem } from '../../../lib/move-item';
import { useCanWrite } from '../../auth/use-can-write';
import { useUpdateStoreMutation } from '../profile/api';

/** Cash toggle + transfer payment methods with country presets, reorder and delete. */
export function PaymentMethodsPanel({ store }: { store: Store }) {
  const { t, i18n } = useTranslation();
  const errorMessage = useErrorMessage();
  const canWrite = useCanWrite();
  const updateStore = useUpdateStoreMutation();
  const methods = usePaymentMethods();
  const { create, reorder } = usePaymentMethodMutations();
  const [adding, setAdding] = useState(false);

  if (methods.error) {
    return <ErrorState error={methods.error} onRetry={() => void methods.refetch()} />;
  }

  const list = methods.data;
  const defaultPreset = presetsForCountry(store.country)[0]?.id ?? '';

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <section className="rounded-card border border-line bg-surface-raised p-5 shadow-card sm:p-6">
        <SwitchField
          label={t('settings.ordering.cash')}
          hint={t('settings.ordering.cashHint')}
          checked={store.cashEnabled}
          disabled={!canWrite || updateStore.isPending}
          onCheckedChange={(cashEnabled) => {
            updateStore.mutate(
              { cashEnabled },
              {
                onSuccess: () => toast.success(t('settings.saved')),
                onError: (error) => toast.error(errorMessage(error)),
              },
            );
          }}
        />
      </section>

      <section className="rounded-card border border-line bg-surface-raised p-5 shadow-card sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold">{t('settings.payments.title')}</h2>
            <p className="mt-0.5 text-sm text-ink-muted">{t('settings.payments.subtitle')}</p>
          </div>
          {adding ? null : (
            <Button
              type="button"
              size="sm"
              disabled={!canWrite}
              onClick={() => {
                setAdding(true);
              }}
            >
              <Plus className="size-4" />
              {t('settings.payments.add')}
            </Button>
          )}
        </div>

        {adding ? (
          <div className="mt-4 rounded-card border border-line bg-surface p-4">
            <PaymentMethodFormView
              country={store.country}
              defaultValues={emptyPaymentMethodForm(defaultPreset, i18n.language)}
              saving={create.isPending}
              submitLabel={t('settings.payments.create')}
              onCancel={() => {
                setAdding(false);
              }}
              onSubmit={(values) => {
                create.mutate(toPaymentMethodInput(values), {
                  onSuccess: (created) => {
                    setAdding(false);
                    toast.success(t('settings.payments.created', { name: created.label }));
                  },
                  onError: (error) => toast.error(errorMessage(error)),
                });
              }}
            />
          </div>
        ) : null}

        {!list ? (
          <div className="mt-4 flex flex-col gap-2">
            {[1, 2].map((key) => (
              <Skeleton key={key} className="h-14" />
            ))}
          </div>
        ) : list.length === 0 ? (
          <p className="mt-6 text-center text-sm text-ink-muted">{t('settings.payments.empty')}</p>
        ) : (
          <ul className="mt-4 divide-y divide-line">
            {list.map((method, index) => (
              <PaymentMethodRow
                key={method.id}
                method={method}
                country={store.country}
                isFirst={index === 0}
                isLast={index === list.length - 1}
                onMove={(delta) => {
                  reorder.mutate(moveItem(list, index, delta), {
                    onError: (error) => toast.error(errorMessage(error)),
                  });
                }}
              />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
