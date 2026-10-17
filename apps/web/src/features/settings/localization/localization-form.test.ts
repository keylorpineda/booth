import { describe, expect, it } from 'vitest';

import { type Store } from '@booth/shared';

import {
  buildCurrencyOptions,
  buildTimeZoneOptions,
  localizationFormSchema,
  toLocalizationForm,
  toLocalizationUpdate,
} from './localization-form';
import { privacyFormSchema, toPrivacyForm, toPrivacyUpdate } from '../privacy/privacy-form';

const baseStore: Store = {
  id: 's1',
  slug: 'la-esquina',
  name: 'La Esquina',
  description: null,
  whatsappPhone: '+50688887777',
  brandColor: '#4f46e5',
  brandForeground: '#ffffff',
  logoUrl: null,
  coverUrl: null,
  country: 'CR',
  currency: 'CRC',
  timezone: 'America/Costa_Rica',
  locale: 'es',
  acceptOrdersWhenClosed: true,
  orderExpirationMinutes: 60,
  pickupEnabled: true,
  pickupAddress: null,
  deliveryEnabled: false,
  cashEnabled: true,
  pricesNote: null,
  privacyNotice: null,
  effectivePrivacyNotice: 'Default Costa Rica privacy notice text.',
  privacyNoticeVersion: 1,
  canChangeCurrency: true,
  isActive: true,
  createdAt: '2026-01-01T00:00:00.000Z',
};

describe('localizationFormSchema & helpers', () => {
  it('includes currency in update payload only when canChangeCurrency is true', () => {
    const values = toLocalizationForm(baseStore);
    expect(localizationFormSchema.parse(values)).toEqual(values);

    const allowed = toLocalizationUpdate({ ...values, currency: 'USD' }, baseStore);
    expect(allowed.currency).toBe('USD');

    const locked = toLocalizationUpdate(
      { ...values, currency: 'USD', country: 'CO' },
      { ...baseStore, canChangeCurrency: false },
    );
    expect(locked.country).toBe('CO');
    expect(locked.currency).toBeUndefined();
  });

  it('builds currency and time zone combobox options', () => {
    const currencies = buildCurrencyOptions('en');
    expect(currencies.some((item) => item.value === 'CRC')).toBe(true);

    const zones = buildTimeZoneOptions();
    const cr = zones.find((item) => item.value === 'America/Costa_Rica');
    expect(cr?.label).toBe('America/Costa Rica');
  });
});

describe('privacyFormSchema & helpers', () => {
  it('prefills with effectivePrivacyNotice and validates custom notice length', () => {
    expect(toPrivacyForm(baseStore)).toEqual({
      notice: 'Default Costa Rica privacy notice text.',
    });

    expect(privacyFormSchema.safeParse({ notice: 'too short' }).success).toBe(false);

    const parsed = privacyFormSchema.parse({
      notice: '  We only use your name and phone to deliver your order.  ',
    });
    expect(toPrivacyUpdate(parsed)).toEqual({
      privacyNotice: 'We only use your name and phone to deliver your order.',
    });
  });
});
