import { describe, expect, it } from 'vitest';

import { currencySymbol, formatMoneyInput, parseMoneyInput } from './money-input';

const minor = (text: string, currency: string) => {
  const result = parseMoneyInput(text, currency);
  return result.ok ? result.minor : result.reason;
};

describe('parseMoneyInput', () => {
  it('reads plain and grouped amounts', () => {
    expect(minor('2500', 'CRC')).toBe(250_000);
    expect(minor('2 500', 'CRC')).toBe(250_000);
    expect(minor('2.500', 'CRC')).toBe(250_000);
    expect(minor('2,500', 'USD')).toBe(250_000);
    expect(minor('1.250.000', 'COP')).toBe(125_000_000);
  });

  it('reads either decimal mark', () => {
    expect(minor('2500,50', 'CRC')).toBe(250_050);
    expect(minor('2.500,50', 'EUR')).toBe(250_050);
    expect(minor('2,500.50', 'USD')).toBe(250_050);
    expect(minor('9.5', 'USD')).toBe(950);
    expect(minor('0,99', 'EUR')).toBe(99);
  });

  it('rejects more decimals than the currency allows', () => {
    expect(minor('10.5', 'JPY')).toBe('decimals');
    expect(minor('1.999', 'USD')).toBe(199_900); // three digits after one mark = thousands
    expect(minor('1,5,0', 'USD')).toBe('invalid');
    expect(minor('2.505,123', 'EUR')).toBe('decimals');
  });

  it('rejects empty and non-numeric text', () => {
    expect(minor('  ', 'USD')).toBe('empty');
    expect(minor('-5', 'USD')).toBe('invalid');
    expect(minor('12a', 'USD')).toBe('invalid');
    expect(minor('12.', 'USD')).toBe('invalid');
  });
});

describe('formatMoneyInput', () => {
  it('formats for editing without the currency sign', () => {
    // Costa Rica groups thousands with a (narrow) space.
    expect(formatMoneyInput(250_000, 'CRC', 'es-CR')).toMatch(/^2\s500$/);
    expect(formatMoneyInput(250_050, 'USD', 'en-US')).toBe('2,500.50');
    expect(formatMoneyInput(1_000, 'JPY', 'ja-JP')).toBe('1,000');
  });

  it('round-trips through the parser', () => {
    for (const [amount, currency, locale] of [
      [250_050, 'CRC', 'es-CR'],
      [123_456_789, 'USD', 'en-US'],
      [99, 'EUR', 'es-ES'],
    ] as const) {
      expect(minor(formatMoneyInput(amount, currency, locale), currency)).toBe(amount);
    }
  });
});

describe('currencySymbol', () => {
  it('uses the local sign', () => {
    expect(currencySymbol('CRC', 'es-CR')).toBe('₡');
    expect(currencySymbol('USD', 'en-US')).toBe('$');
  });
});
