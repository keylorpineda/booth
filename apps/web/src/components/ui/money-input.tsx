import { type ComponentProps } from 'react';

import { Input } from './input';
import { cn } from '../../lib/cn';
import { currencySymbol, formatMoneyInput, parseMoneyInput } from '../../lib/money-input';

type MoneyInputProps = Omit<ComponentProps<'input'>, 'value' | 'onChange' | 'type'> & {
  /** The text the person typed; forms convert it with `parseMoneyInput` (never floats). */
  value: string;
  onChange: (text: string) => void;
  currency: string;
  /** Formatting locale, e.g. "es-CR": decides the grouping and decimal mark shown on blur. */
  locale: string;
};

/** Amount field with the currency sign; tidies the amount ("2500" -> "2 500") on blur. */
export function MoneyInput({
  value,
  onChange,
  onBlur,
  currency,
  locale,
  className,
  ...props
}: MoneyInputProps) {
  const symbol = currencySymbol(currency, locale);

  return (
    <div className="relative">
      <span
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 font-semibold text-ink-muted"
      >
        {symbol}
      </span>
      <Input
        {...props}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
        }}
        onBlur={(event) => {
          const parsed = parseMoneyInput(value, currency);
          if (parsed.ok) onChange(formatMoneyInput(parsed.minor, currency, locale));
          onBlur?.(event);
        }}
        className={cn('tabular-nums', symbol.length > 1 ? 'pl-14' : 'pl-9', className)}
      />
    </div>
  );
}
