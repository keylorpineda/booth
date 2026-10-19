import { type ReactNode, useId } from 'react';

import { Switch } from './switch';

interface SwitchFieldProps {
  label: ReactNode;
  hint?: ReactNode;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
}

/** A labelled on/off setting: the whole row explains what the switch does. */
export function SwitchField({ label, hint, checked, onCheckedChange, disabled }: SwitchFieldProps) {
  const id = useId();
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <label htmlFor={id} className="font-medium">
          {label}
        </label>
        {hint ? (
          <p id={`${id}-hint`} className="text-sm text-ink-muted">
            {hint}
          </p>
        ) : null}
      </div>
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled ?? false}
        aria-describedby={hint ? `${id}-hint` : undefined}
      />
    </div>
  );
}
