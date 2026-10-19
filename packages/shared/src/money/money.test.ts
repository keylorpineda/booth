import { describe, expect, it } from 'vitest';

import { getCurrencyExponent } from './currencies';
import { formatMoney, fromMinor, toMinor } from './money';
import { currencyCodeSchema } from './schemas';

describe('getCurrencyExponent', () => {
  it.each([
    ['CRC', 2],
    ['USD', 2],
    ['COP', 2],
    ['JPY', 0],
    ['CLP', 0],
    ['KWD', 3],
  ])('%s has %i decimals', (currency, exponent) => {
    expect(getCurrencyExponent(currency)).toBe(exponent);
  });
});

describe('toMinor', () => {
  it.each([
    ['1234.56', 'CRC', 123456],
    ['1234.5', 'USD', 123450],
    ['10', 'USD', 1000],
    ['1500', 'JPY', 1500],
    ['25000', 'CLP', 25000],
    ['1.234', 'KWD', 1234],
    ['0.10', 'USD', 10],
  ])('converts %s %s to %i', (major, currency, minor) => {
    expect(toMinor(major, currency)).toBe(minor);
  });

  it('avoids floating-point errors', () => {
    expect(toMinor(0.1 + 0.2, 'USD')).toBe(30);
    expect(toMinor('19.99', 'USD')).toBe(1999);
  });

  it('rejects more decimals than the currency allows', () => {
    expect(() => toMinor('10.5', 'JPY')).toThrow(RangeError);
    expect(() => toMinor('1.001', 'USD')).toThrow(RangeError);
  });

  it('rejects invalid amounts', () => {
    expect(() => toMinor('-5', 'USD')).toThrow(RangeError);
    expect(() => toMinor('abc', 'USD')).toThrow(RangeError);
    expect(() => toMinor('1e5', 'USD')).toThrow(RangeError);
  });
});

describe('fromMinor', () => {
  it.each([
    [123456, 'CRC', '1234.56'],
    [5, 'USD', '0.05'],
    [1500, 'JPY', '1500'],
    [1234, 'KWD', '1.234'],
  ])('converts %i %s to %s', (minor, currency, major) => {
    expect(fromMinor(minor, currency)).toBe(major);
  });

  it('rejects non-integers and negatives', () => {
    expect(() => fromMinor(1.5, 'USD')).toThrow(RangeError);
    expect(() => fromMinor(-1, 'USD')).toThrow(RangeError);
  });
});

describe('formatMoney', () => {
  it('formats CRC for Costa Rica without a zero fraction', () => {
    expect(formatMoney(350000, 'CRC', 'es-CR')).toMatch(/^₡\s?3\s?500$/);
  });

  it('keeps a non-zero fraction', () => {
    expect(formatMoney(1999, 'USD', 'en-US')).toBe('$19.99');
  });

  it('can always show the fraction', () => {
    expect(formatMoney(1000, 'USD', 'en-US', { hideZeroFraction: false })).toBe('$10.00');
  });

  it('formats zero-decimal and three-decimal currencies', () => {
    expect(formatMoney(1500, 'JPY', 'ja-JP')).toMatch(/1,500/);
    expect(formatMoney(1234, 'KWD', 'en-US')).toMatch(/1\.234/);
  });
});

describe('currencyCodeSchema', () => {
  it('accepts supported ISO codes and rejects others', () => {
    expect(currencyCodeSchema.safeParse('CRC').success).toBe(true);
    expect(currencyCodeSchema.safeParse('crc').success).toBe(false);
    expect(currencyCodeSchema.safeParse('ZZZ').success).toBe(false);
  });
});
