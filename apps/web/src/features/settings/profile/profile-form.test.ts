import { describe, expect, it } from 'vitest';

import { DEFAULT_BRAND_COLOR, readableForeground } from '@booth/shared';

import { isValidHexColor, profileFormSchema, toProfileUpdate } from './profile-form';

describe('profileFormSchema', () => {
  const schema = profileFormSchema('CR');

  it('normalizes phone to E.164, uppercases hex color, and turns empty optional fields into null', () => {
    const parsed = schema.parse({
      name: '  Panadería La Esquina ',
      description: '   ',
      whatsappPhone: '8888-7777',
      pricesNote: '  IVA incluido ',
      brandColor: '#4f46e5',
    });

    expect(toProfileUpdate(parsed, 'CR')).toEqual({
      name: 'Panadería La Esquina',
      description: null,
      whatsappPhone: '+50688887777',
      pricesNote: 'IVA incluido',
      brandColor: '#4F46E5',
    });
  });

  it('rejects an invalid phone and a malformed hex color with i18n keys', () => {
    const result = schema.safeParse({
      name: 'Ab',
      description: '',
      whatsappPhone: 'not-a-phone',
      pricesNote: '',
      brandColor: 'indigo',
    });

    expect(result.success).toBe(false);
    const messages = result.error?.issues.map((issue) => [issue.path.join('.'), issue.message]);
    expect(messages).toContainEqual(['whatsappPhone', 'validation.phone']);
    expect(messages).toContainEqual(['brandColor', 'validation.hexColor']);
  });

  it('switches button text to black on light brand colors such as yellow', () => {
    expect(isValidHexColor('#FACC15')).toBe(true);
    expect(readableForeground('#FACC15')).toBe('#000000');
    expect(readableForeground(DEFAULT_BRAND_COLOR)).toBe('#FFFFFF');
  });
});
