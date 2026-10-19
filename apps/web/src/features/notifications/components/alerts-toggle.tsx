import { Bell, BellOff, BellRing } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { cn } from '../../../lib/cn';
import { type AlertsSetting } from '../use-alerts-setting';

interface AlertsToggleProps {
  setting: AlertsSetting;
  onToggle: () => void;
}

const ICONS = { on: BellRing, off: Bell, blocked: BellOff, unsupported: BellOff } as const;

/** Header bell: turns system notifications for new orders and receipts on or off. */
export function AlertsToggle({ setting, onToggle }: AlertsToggleProps) {
  const { t } = useTranslation();
  if (setting === 'unsupported') return null;
  const Icon = ICONS[setting];
  const label = t(`alerts.toggle.${setting}`);

  return (
    <button
      type="button"
      aria-pressed={setting === 'on'}
      aria-label={label}
      title={label}
      onClick={onToggle}
      className={cn(
        'grid size-10 place-items-center rounded-full transition-colors hover:bg-surface-sunken',
        setting === 'on' ? 'text-brand-ink' : 'text-ink-muted',
      )}
    >
      <Icon className="size-5" />
    </button>
  );
}
