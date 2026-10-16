import { z } from 'zod';

import { getCurrencyExponent } from './currencies';

/** An amount in the minor units of a currency (e.g. cents). Always a safe integer. */
export type MinorUnits = number;

export const minorUnitsSchema = z
  .number()
  .int()
  .nonnegative()
  .max(Number.MAX_SAFE_INTEGER, 'Amount too large');

const DECIMAL_PATTERN = /^(\d+)(?:\.(\d+))?$/;

/**
 * Converts a decimal amount in major units ("1234.5") to minor units (123450 for USD).
 * Works on the string representation to avoid floating-point errors.
 * Throws if the value has more decimals than the currency allows or is not a valid amount.
 */
export function toMinor(major: string | number, currency: string): MinorUnits {
  const exponent = getCurrencyExponent(currency);
  const text = typeof major === 'number' ? major.toFixed(exponent) : major.trim();
  const match = DECIMAL_PATTERN.exec(text);
  if (!match) throw new RangeError(`Invalid amount: "${text}"`);

  const [, whole = '0', fraction = ''] = match;
  const significantFraction = fraction.replace(/0+$/, '');
  if (significantFraction.length > exponent) {
    throw new RangeError(`${currency} allows at most ${exponent} decimals: "${text}"`);
  }

  const minor = BigInt(whole + significantFraction.padEnd(exponent, '0'));
  if (minor > BigInt(Number.MAX_SAFE_INTEGER)) throw new RangeError(`Amount too large: "${text}"`);
  return Number(minor);
}

/** Converts minor units to a plain decimal string in major units (123450 USD -> "1234.50"). */
export function fromMinor(minor: MinorUnits, currency: string): string {
  assertMinor(minor);
  const exponent = getCurrencyExponent(currency);
  if (exponent === 0) return String(minor);

  const digits = String(minor).padStart(exponent + 1, '0');
  return `${digits.slice(0, -exponent)}.${digits.slice(-exponent)}`;
}

export interface FormatMoneyOptions {
  /** Drop the fraction when it is zero ("₡3 500" instead of "₡3 500,00"). Default: true. */
  hideZeroFraction?: boolean;
}

/** Formats minor units for display with `Intl.NumberFormat` in the given locale. */
export function formatMoney(
  minor: MinorUnits,
  currency: string,
  locale: string,
  { hideZeroFraction = true }: FormatMoneyOptions = {},
): string {
  assertMinor(minor);
  const exponent = getCurrencyExponent(currency);
  const fractionDigits = hideZeroFraction && minor % 10 ** exponent === 0 ? 0 : exponent;
  const formatter = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });

  // Intl accepts decimal strings, which keeps large amounts exact (no float conversion).
  return formatter.format(fromMinor(minor, currency) as Intl.StringNumericLiteral);
}

function assertMinor(minor: number): void {
  if (!Number.isSafeInteger(minor) || minor < 0) {
    throw new RangeError('Minor units must be a non-negative safe integer');
  }
}
