import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { useDeliveryZoneMutations, useDeliveryZones } from './api';
import { NewZoneForm } from './new-zone-form';
import { ZoneRow } from './zone-row';
import { ErrorState } from '../../../components/feedback/error-state';
import { Skeleton } from '../../../components/ui/skeleton';
import { useErrorMessage } from '../../../hooks/use-error-message';
import { moveItem } from '../../../lib/move-item';
import { useOwnerLocale } from '../../dashboard/use-owner-money';

/** Delivery zones list, creation form and optimistic reordering. */
export function DeliveryZonesCard({ currency }: { currency: string }) {
  const { t } = useTranslation();
  const errorMessage = useErrorMessage();
  const locale = useOwnerLocale();
  const zones = useDeliveryZones();
  const { reorder } = useDeliveryZoneMutations();

  if (zones.error) {
    return <ErrorState error={zones.error} onRetry={() => void zones.refetch()} />;
  }

  const list = zones.data;
  const move = (index: number, delta: -1 | 1) => {
    if (!list) return;
    reorder.mutate(moveItem(list, index, delta), {
      onError: (error) => toast.error(errorMessage(error)),
    });
  };

  return (
    <section className="rounded-card border border-line bg-surface-raised p-5 shadow-card sm:p-6">
      <h2 className="text-lg font-bold">{t('settings.zones.title')}</h2>
      <p className="mt-0.5 text-sm text-ink-muted">{t('settings.zones.hint')}</p>
      <div className="mt-4">
        <NewZoneForm currency={currency} locale={locale} />
      </div>
      {!list ? (
        <div className="mt-4 flex flex-col gap-2">
          {[1, 2].map((key) => (
            <Skeleton key={key} className="h-14" />
          ))}
        </div>
      ) : list.length === 0 ? (
        <p className="mt-6 text-center text-sm text-ink-muted">{t('settings.zones.empty')}</p>
      ) : (
        <ul className="mt-4 divide-y divide-line">
          {list.map((zone, index) => (
            <ZoneRow
              key={zone.id}
              zone={zone}
              currency={currency}
              locale={locale}
              isFirst={index === 0}
              isLast={index === list.length - 1}
              onMove={(delta) => {
                move(index, delta);
              }}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
