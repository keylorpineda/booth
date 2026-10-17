import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { type DeliveryZone } from '@booth/shared';

import { useDeliveryZoneMutations } from './api';
import { ZoneEditor } from './zone-editor';
import { ConfirmDialog } from '../../../components/ui/confirm-dialog';
import { Switch } from '../../../components/ui/switch';
import { useErrorMessage } from '../../../hooks/use-error-message';
import { cn } from '../../../lib/cn';
import { useCanWrite } from '../../auth/use-can-write';
import { CategoryRowActions } from '../../catalog-admin/categories/category-row-actions';
import { useOwnerMoney } from '../../dashboard/use-owner-money';

interface ZoneRowProps {
  zone: DeliveryZone;
  currency: string;
  locale: string;
  isFirst: boolean;
  isLast: boolean;
  onMove: (delta: -1 | 1) => void;
}

/** One delivery zone row: name, formatted fee, visibility switch, reorder, edit and delete. */
export function ZoneRow({ zone, currency, locale, isFirst, isLast, onMove }: ZoneRowProps) {
  const { t } = useTranslation();
  const errorMessage = useErrorMessage();
  const canWrite = useCanWrite();
  const formatMoney = useOwnerMoney();
  const { update, remove } = useDeliveryZoneMutations();
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <li className="flex items-center gap-2 py-3">
      {editing ? (
        <ZoneEditor
          zone={zone}
          currency={currency}
          locale={locale}
          onClose={() => {
            setEditing(false);
          }}
        />
      ) : (
        <>
          <div className="min-w-0 flex-1">
            <p className={cn('truncate font-semibold', !zone.isActive && 'text-ink-muted')}>
              {zone.name}
            </p>
            <p className="text-sm text-ink-muted">
              {zone.feeMinor === 0
                ? t('settings.zones.free')
                : formatMoney(zone.feeMinor, currency)}
              {zone.isActive ? '' : ` · ${t('catalog.categories.hidden')}`}
            </p>
          </div>
          <Switch
            checked={zone.isActive}
            disabled={!canWrite || update.isPending}
            aria-label={t('settings.zones.visible', { name: zone.name })}
            onCheckedChange={(isActive) => {
              update.mutate(
                { id: zone.id, isActive },
                { onError: (error) => toast.error(errorMessage(error)) },
              );
            }}
          />
          <CategoryRowActions
            name={zone.name}
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
        </>
      )}
      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title={t('settings.zones.deleteTitle', { name: zone.name })}
        description={t('settings.zones.deleteText')}
        confirmLabel={t('settings.zones.deleteConfirm')}
        destructive
        loading={remove.isPending}
        onConfirm={() => {
          remove.mutate(zone.id, {
            onSuccess: () => {
              setConfirmDelete(false);
              toast.success(t('settings.zones.deleted', { name: zone.name }));
            },
            onError: (error) => toast.error(errorMessage(error)),
          });
        }}
      />
    </li>
  );
}
