import { m } from 'motion/react';
import { RadioGroup } from 'radix-ui';
import { type ReactNode, useId } from 'react';

import { cn } from '../../lib/cn';
import { spring } from '../../lib/motion';

export interface OptionCard {
  value: string;
  title: ReactNode;
  description?: ReactNode | undefined;
  icon?: ReactNode;
  /** Shown on the right, e.g. a delivery fee. */
  aside?: ReactNode;
}

interface OptionCardsProps {
  value: string | undefined;
  onValueChange: (value: string) => void;
  options: OptionCard[];
  /** Used to keep the animated selection ring separate per group. */
  name: string;
  /** Accessible name of the group when no visible <label> points at it. */
  label?: string;
  id?: string;
  className?: string;
  'aria-invalid'?: boolean;
  'aria-describedby'?: string;
}

/** Radio group drawn as tappable cards; the selection ring glides between options. */
export function OptionCards({
  value,
  onValueChange,
  options,
  name,
  label,
  id,
  className,
  ...aria
}: OptionCardsProps) {
  const baseId = useId();

  return (
    <RadioGroup.Root
      id={id}
      aria-label={label}
      value={value ?? ''}
      onValueChange={onValueChange}
      className={cn('grid gap-2.5', className)}
      {...aria}
    >
      {options.map((option, index) => {
        const selected = option.value === value;
        const titleId = `${baseId}-${index}-title`;
        const descriptionId = `${baseId}-${index}-desc`;
        return (
          <RadioGroup.Item
            key={option.value}
            value={option.value}
            aria-labelledby={titleId}
            aria-describedby={option.description ? descriptionId : undefined}
            className="relative flex min-h-14 items-center gap-3 rounded-card border border-line bg-surface-raised px-4 py-3 text-left transition-colors hover:border-line-strong focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-surface focus-visible:outline-none"
          >
            {selected ? (
              <m.span
                layoutId={`${name}-ring`}
                transition={spring.snappy}
                className="absolute inset-0 rounded-card border-2 border-brand bg-brand-soft/60"
              />
            ) : null}
            {option.icon ? <span className="relative text-brand-ink">{option.icon}</span> : null}
            <span className="relative flex-1">
              <span id={titleId} className="block font-semibold text-ink">
                {option.title}
              </span>
              {option.description ? (
                <span id={descriptionId} className="block text-sm text-ink-muted">
                  {option.description}
                </span>
              ) : null}
            </span>
            {option.aside ? (
              <span className="relative text-sm font-semibold text-ink">{option.aside}</span>
            ) : null}
          </RadioGroup.Item>
        );
      })}
    </RadioGroup.Root>
  );
}
