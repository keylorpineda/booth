import { Copy, Plus, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { makeShift, type ShiftInput, type ShiftIssue } from './hours-form';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Switch } from '../../../components/ui/switch';
import { formatWeekday } from '../../storefront/hours-format';

interface WeekdayRowProps {
  weekday: number;
  shifts: readonly ShiftInput[];
  issues: Readonly<Record<string, ShiftIssue>>;
  disabled: boolean;
  onChange: (shifts: ShiftInput[]) => void;
  onCopyToWeekdays: () => void;
  onCopyToAll: () => void;
}

/** One weekday row: open/closed toggle, one or more intervals (split shifts), and copy actions. */
export function WeekdayRow({
  weekday,
  shifts,
  issues,
  disabled,
  onChange,
  onCopyToWeekdays,
  onCopyToAll,
}: WeekdayRowProps) {
  const { t, i18n } = useTranslation();
  const dayName = formatWeekday(weekday, i18n.language);
  const open = shifts.length > 0;

  const updateShift = (index: number, patch: Partial<ShiftInput>) => {
    onChange(shifts.map((shift, i) => (i === index ? { ...shift, ...patch } : shift)));
  };

  return (
    <li className="flex flex-col gap-3 py-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Switch
            checked={open}
            disabled={disabled}
            aria-label={t('settings.hours.toggleDay', { day: dayName })}
            onCheckedChange={(checked) => {
              onChange(checked ? [makeShift('09:00', '18:00')] : []);
            }}
          />
          <span className="font-semibold capitalize">{dayName}</span>
          {open ? null : (
            <span className="text-sm text-ink-muted">{t('settings.hours.closedDay')}</span>
          )}
        </div>
        {open ? (
          <div className="flex flex-wrap items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={disabled || shifts.length >= 4}
              onClick={() => {
                onChange([...shifts, makeShift('14:00', '19:00')]);
              }}
            >
              <Plus className="size-4" />
              {t('settings.hours.addShift')}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={disabled}
              onClick={onCopyToWeekdays}
            >
              <Copy className="size-3.5" />
              {t('settings.hours.copyWeekdays')}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={disabled}
              onClick={onCopyToAll}
            >
              {t('settings.hours.copyAll')}
            </Button>
          </div>
        ) : null}
      </div>

      {open ? (
        <div className="flex flex-col gap-2 pl-11">
          {shifts.map((shift, index) => {
            const issue = issues[`${String(weekday)}:${String(index)}`];
            return (
              <div key={shift.id} className="flex flex-col gap-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Input
                    type="time"
                    value={shift.opensAt}
                    disabled={disabled}
                    aria-label={t('settings.hours.opensAt', { day: dayName, shift: index + 1 })}
                    aria-invalid={issue ? true : undefined}
                    onChange={(event) => {
                      updateShift(index, { opensAt: event.target.value });
                    }}
                    className="h-10 w-36 tabular-nums"
                  />
                  <span className="text-sm text-ink-muted">–</span>
                  <Input
                    type="time"
                    value={shift.closesAt}
                    disabled={disabled}
                    aria-label={t('settings.hours.closesAt', { day: dayName, shift: index + 1 })}
                    aria-invalid={issue ? true : undefined}
                    onChange={(event) => {
                      updateShift(index, { closesAt: event.target.value });
                    }}
                    className="h-10 w-36 tabular-nums"
                  />
                  {shifts.length > 1 ? (
                    <button
                      type="button"
                      disabled={disabled}
                      aria-label={t('settings.hours.removeShift', {
                        day: dayName,
                        shift: index + 1,
                      })}
                      onClick={() => {
                        onChange(shifts.filter((_, i) => i !== index));
                      }}
                      className="grid size-9 place-items-center rounded-full text-ink-muted hover:bg-surface-sunken hover:text-danger disabled:opacity-30"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  ) : null}
                </div>
                {issue ? (
                  <p role="alert" className="text-sm text-danger">
                    {t(`settings.hours.errors.${issue}`)}
                  </p>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : null}
    </li>
  );
}
