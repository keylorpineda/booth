import { Minus, Plus, Trash2 } from 'lucide-react';
import { m } from 'motion/react';
import { useTranslation } from 'react-i18next';

import { cn } from '../../lib/cn';
import { pressable } from '../../lib/motion';
import { AnimatedNumber } from '../motion/animated-number';

interface QuantityStepperProps {
  value: number;
  onChange: (value: number) => void;
  max?: number | undefined;
  /** When true, the minus button turns into "remove" at quantity 1. */
  removable?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

export function QuantityStepper({
  value,
  onChange,
  max = 99,
  removable = false,
  size = 'md',
  className,
}: QuantityStepperProps) {
  const { t } = useTranslation();
  const button = cn(
    'grid place-items-center rounded-full text-ink transition-colors hover:bg-surface-sunken disabled:opacity-40',
    size === 'sm' ? 'size-8' : 'size-11',
  );
  const willRemove = removable && value <= 1;

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full border border-line bg-surface-raised',
        className,
      )}
    >
      <m.button
        type="button"
        className={button}
        aria-label={willRemove ? t('cart.remove') : t('cart.decrease')}
        disabled={!removable && value <= 1}
        onClick={() => {
          onChange(value - 1);
        }}
        {...pressable}
      >
        {willRemove ? <Trash2 className="size-4 text-danger" /> : <Minus className="size-4" />}
      </m.button>
      <AnimatedNumber
        value={value}
        className={cn('min-w-7 justify-center font-semibold', size === 'sm' && 'text-sm')}
      />
      <m.button
        type="button"
        className={button}
        aria-label={t('cart.increase')}
        disabled={value >= max}
        onClick={() => {
          onChange(value + 1);
        }}
        {...pressable}
      >
        <Plus className="size-4" />
      </m.button>
    </div>
  );
}
