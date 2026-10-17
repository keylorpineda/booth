import { Clock } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { type BusinessHour, type Store } from '@booth/shared';

import { useBusinessHours, useReplaceBusinessHoursMutation } from './api';
import {
  copyDayTo,
  isWeekEmpty,
  type ShiftIssue,
  toWeekSchedule,
  validateWeekSchedule,
  WEEKDAY_ORDER,
  type WeekSchedule,
} from './hours-form';
import { WeekdayRow } from './weekday-row';
import { ErrorState } from '../../../components/feedback/error-state';
import { Button } from '../../../components/ui/button';
import { Skeleton } from '../../../components/ui/skeleton';
import { SwitchField } from '../../../components/ui/switch-field';
import { useErrorMessage } from '../../../hooks/use-error-message';
import { useCanWrite } from '../../auth/use-can-write';
import { useUpdateStoreMutation } from '../profile/api';

const WEEKDAYS_MON_FRI = [1, 2, 3, 4, 5] as const;

export function HoursPanel({ store }: { store: Store }) {
  const { t } = useTranslation();
  const errorMessage = useErrorMessage();
  const canWrite = useCanWrite();
  const updateStore = useUpdateStoreMutation();
  const hoursQuery = useBusinessHours();

  if (hoursQuery.error) {
    return <ErrorState error={hoursQuery.error} onRetry={() => void hoursQuery.refetch()} />;
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <section className="rounded-card border border-line bg-surface-raised p-5 shadow-card sm:p-6">
        <SwitchField
          label={t('settings.ordering.acceptWhenClosed')}
          hint={t('settings.ordering.acceptWhenClosedHint')}
          checked={store.acceptOrdersWhenClosed}
          disabled={!canWrite || updateStore.isPending}
          onCheckedChange={(acceptOrdersWhenClosed) => {
            updateStore.mutate(
              { acceptOrdersWhenClosed },
              {
                onSuccess: () => toast.success(t('settings.saved')),
                onError: (error) => toast.error(errorMessage(error)),
              },
            );
          }}
        />
      </section>

      {hoursQuery.data ? (
        <HoursEditorCard
          key={JSON.stringify(hoursQuery.data)}
          initialHours={hoursQuery.data}
          timezone={store.timezone}
        />
      ) : (
        <Skeleton className="h-[28rem] rounded-card" />
      )}
    </div>
  );
}

function HoursEditorCard({
  initialHours,
  timezone,
}: {
  initialHours: readonly BusinessHour[];
  timezone: string;
}) {
  const { t } = useTranslation();
  const errorMessage = useErrorMessage();
  const canWrite = useCanWrite();
  const replace = useReplaceBusinessHoursMutation();
  const [week, setWeek] = useState<WeekSchedule>(() => toWeekSchedule(initialHours));
  const [issues, setIssues] = useState<Record<string, ShiftIssue>>({});

  const empty = isWeekEmpty(week);

  const save = () => {
    const validated = validateWeekSchedule(week);
    setIssues(validated.issues);
    if (Object.keys(validated.issues).length > 0) return;
    replace.mutate(validated.hours, {
      onSuccess: () => toast.success(t('settings.saved')),
      onError: (error) => toast.error(errorMessage(error)),
    });
  };

  return (
    <section className="rounded-card border border-line bg-surface-raised p-5 shadow-card sm:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h2 className="text-lg font-bold">{t('settings.hours.title')}</h2>
          <p className="mt-0.5 text-sm text-ink-muted">
            {t('settings.hours.subtitle', { timezone })}
          </p>
        </div>
        {empty ? null : (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={!canWrite}
            onClick={() => {
              setWeek(toWeekSchedule([]));
              setIssues({});
            }}
          >
            {t('settings.hours.clearAll')}
          </Button>
        )}
      </div>

      {empty ? (
        <div className="mt-4 flex items-center gap-3 rounded-card border border-line bg-surface p-4 text-sm text-ink-muted">
          <Clock className="size-5 shrink-0 text-brand-ink" />
          <p>{t('settings.hours.alwaysOpenNotice')}</p>
        </div>
      ) : null}

      <ul className="mt-4 divide-y divide-line">
        {WEEKDAY_ORDER.map((day) => (
          <WeekdayRow
            key={day}
            weekday={day}
            shifts={week[day] ?? []}
            issues={issues}
            disabled={!canWrite}
            onChange={(shifts) => {
              setWeek((current) => ({ ...current, [day]: shifts }));
              setIssues({});
            }}
            onCopyToWeekdays={() => {
              setWeek((current) => copyDayTo(current, day, WEEKDAYS_MON_FRI));
              setIssues({});
              toast.success(t('settings.hours.copied'));
            }}
            onCopyToAll={() => {
              setWeek((current) => copyDayTo(current, day, WEEKDAY_ORDER));
              setIssues({});
              toast.success(t('settings.hours.copied'));
            }}
          />
        ))}
      </ul>

      <div className="mt-5">
        <Button
          type="button"
          size="lg"
          disabled={!canWrite}
          loading={replace.isPending}
          onClick={save}
        >
          {t('settings.save')}
        </Button>
      </div>
    </section>
  );
}
