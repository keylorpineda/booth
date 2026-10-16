import { describe, expect, it } from 'vitest';

import { e164PhoneSchema, getCallingCode, isValidE164, toE164, toWhatsAppNumber } from './phone';

describe('toE164', () => {
  it('reads local numbers with the default country', () => {
    expect(toE164('8888 7777', 'CR')).toBe('+50688887777');
    expect(toE164('(212) 555-0123', 'US')).toBe('+12125550123');
  });

  it('keeps international numbers regardless of the default country', () => {
    expect(toE164('+57 300 123 4567', 'CR')).toBe('+573001234567');
  });

  it('returns null for invalid numbers', () => {
    expect(toE164('123', 'CR')).toBeNull();
    expect(toE164('not a phone')).toBeNull();
    expect(toE164('88887777', 'ZZ')).toBeNull();
  });
});

describe('isValidE164', () => {
  it('accepts normalized numbers only', () => {
    expect(isValidE164('+50688887777')).toBe(true);
    expect(isValidE164('50688887777')).toBe(false);
    expect(isValidE164('+506 8888 7777')).toBe(false);
  });
});

describe('getCallingCode', () => {
  it.each([
    ['CR', '506'],
    ['US', '1'],
    ['BR', '55'],
  ])('%s -> %s', (country, code) => {
    expect(getCallingCode(country)).toBe(code);
  });

  it('returns null for unknown countries', () => {
    expect(getCallingCode('ZZ')).toBeNull();
  });
});

describe('toWhatsAppNumber', () => {
  it('drops the plus sign', () => {
    expect(toWhatsAppNumber('+50688887777')).toBe('50688887777');
  });
});

describe('e164PhoneSchema', () => {
  it('validates E.164 numbers', () => {
    expect(e164PhoneSchema.safeParse('+50688887777').success).toBe(true);
    expect(e164PhoneSchema.safeParse('88887777').success).toBe(false);
  });
});
