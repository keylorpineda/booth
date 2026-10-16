import { describe, expect, it } from 'vitest';

import { guessCountry, onboardingFormSchema, toCreateStoreInput } from './onboarding-form';

const valid = {
  name: 'Panadería La Esquina',
  slug: 'la-esquina',
  country: 'CR',
  whatsappPhone: '8888 1234',
};

describe('onboarding form', () => {
  it('normalizes the WhatsApp number with the chosen country', () => {
    const form = onboardingFormSchema.parse(valid);
    expect(toCreateStoreInput(form)).toEqual({
      name: 'Panadería La Esquina',
      slug: 'la-esquina',
      country: 'CR',
      whatsappPhone: '+50688881234',
    });
    expect(
      toCreateStoreInput({ ...form, country: 'US', whatsappPhone: '(415) 555-2671' }),
    ).toMatchObject({ whatsappPhone: '+14155552671' });
  });

  it('rejects a number that is not valid for the country', () => {
    const result = onboardingFormSchema.safeParse({ ...valid, whatsappPhone: '123' });
    expect(result.error?.issues[0]).toMatchObject({
      path: ['whatsappPhone'],
      message: 'validation.phone',
    });
  });

  it.each([
    ['La Esquina', 'onboarding.slugInvalid'],
    ['a--b', 'onboarding.slugInvalid'],
    ['ab', 'validation.tooShort'],
    ['admin', 'onboarding.slugReserved'],
  ])('rejects the slug %s', (slug, message) => {
    const result = onboardingFormSchema.safeParse({ ...valid, slug });
    expect(result.error?.issues[0]?.message).toBe(message);
  });

  it('guesses the country from the browser languages', () => {
    expect(guessCountry(['es-MX', 'es'])).toBe('MX');
    expect(guessCountry(['en-US'])).toBe('US');
    expect(guessCountry([])).toBe('CR');
  });
});
