import { fromMinor, getCurrencyExponent, toMinor } from '@booth/shared';

export type MoneyParseResult =
  { ok: true; minor: number } | { ok: false; reason: 'empty' | 'invalid' | 'decimals' };

/**
 * Reads an amount typed by a person, in any common style: "2500", "2 500", "2.500,50",
 * "2,500.50". The last separator followed by up to `exponent` digits is the decimal mark; other
 * separators are thousands. Converts with `toMinor` (string math, never floats).
 */
export function parseMoneyInput(text: string, currency: string): MoneyParseResult {
  const exponent = getCurrencyExponent(currency);
  // \s also covers the (narrow) no-break spaces Intl uses for grouping.
  const compact = text.replace(/[\s']/g, '');
  if (compact === '') return { ok: false, reason: 'empty' };
  if (!/^\d[\d.,]*$/.test(compact) || /[.,]$/.test(compact)) {
    return { ok: false, reason: 'invalid' };
  }

  const lastSeparator = Math.max(compact.lastIndexOf('.'), compact.lastIndexOf(','));
  let whole = compact;
  let fraction = '';
  if (lastSeparator >= 0) {
    const after = compact.slice(lastSeparator + 1);
    const separator = compact.charAt(lastSeparator);
    const usedOnce = compact.indexOf(separator) === lastSeparator;
    const otherSeparatorBefore = /[.,]/.test(
      compact.slice(0, lastSeparator).replaceAll(separator, ''),
    );
    // A decimal mark: the only use of that character, and not a group of exactly three digits
    // (unless the other separator already appeared, as in "2.500,50").
    const isDecimal = usedOnce && (after.length !== 3 || otherSeparatorBefore || exponent >= 3);
    if (isDecimal) {
      whole = compact.slice(0, lastSeparator);
      fraction = after;
      if (fraction.replace(/0+$/, '').length > exponent) return { ok: false, reason: 'decimals' };
    }
  }

  // Thousands groups: after the first, every group has exactly three digits ("1.250.000").
  const groups = whole.split(/[.,]/);
  if (groups.slice(1).some((group) => group.length !== 3)) return { ok: false, reason: 'invalid' };
  const digits = groups.join('');
  if (!/^\d+$/.test(digits)) return { ok: false, reason: 'invalid' };
  try {
    return { ok: true, minor: toMinor(fraction ? `${digits}.${fraction}` : digits, currency) };
  } catch {
    return { ok: false, reason: 'invalid' };
  }
}

/** Minor units as an editable amount in the interface language ("2 500" or "2 500,50"). */
export function formatMoneyInput(minor: number, currency: string, locale: string): string {
  const exponent = getCurrencyExponent(currency);
  const hasFraction = minor % 10 ** exponent !== 0;
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: hasFraction ? exponent : 0,
    maximumFractionDigits: exponent,
  }).format(Number(fromMinor(minor, currency)));
}

/** The currency sign shown before the input ("₡", "$", "€"). */
export function currencySymbol(currency: string, locale: string): string {
  const part = new Intl.NumberFormat(locale, { style: 'currency', currency })
    .formatToParts(0)
    .find((item) => item.type === 'currency');
  return part?.value ?? currency;
}
