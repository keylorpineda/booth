import { z } from 'zod';

import {
  countryCodeSchema,
  type CreateStoreInput,
  getSupportedCountries,
  RESERVED_SLUGS,
  SLUG_MAX_LENGTH,
  SLUG_MIN_LENGTH,
  STORE_DEFAULTS,
  toE164,
} from '@booth/shared';

export const slugField = z
  .string()
  .trim()
  .min(SLUG_MIN_LENGTH, 'validation.tooShort')
  .max(SLUG_MAX_LENGTH, 'validation.tooLong')
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'onboarding.slugInvalid')
  .refine((slug) => !RESERVED_SLUGS.has(slug), 'onboarding.slugReserved');

/** Form-shaped onboarding schema (same rules as the API's createStoreSchema, i18n messages). */
export const onboardingFormSchema = z
  .object({
    name: z.string().trim().min(2, 'validation.tooShort').max(80, 'validation.tooLong'),
    slug: slugField,
    country: countryCodeSchema,
    whatsappPhone: z.string().trim().min(1, 'validation.required'),
  })
  .superRefine((form, ctx) => {
    if (!toE164(form.whatsappPhone, form.country)) {
      ctx.addIssue({ code: 'custom', path: ['whatsappPhone'], message: 'validation.phone' });
    }
  });

export type OnboardingFormInput = z.input<typeof onboardingFormSchema>;
export type OnboardingForm = z.output<typeof onboardingFormSchema>;

/** Currency, time zone and language come from the country profile on the server. */
export function toCreateStoreInput(form: OnboardingForm): CreateStoreInput {
  return {
    name: form.name,
    slug: form.slug,
    country: form.country,
    whatsappPhone: toE164(form.whatsappPhone, form.country) ?? form.whatsappPhone,
  };
}

/** The visitor's country from the browser language ("es-CR" -> "CR"), else Costa Rica. */
export function guessCountry(languages: readonly string[] = navigator.languages): string {
  const supported = new Set(getSupportedCountries());
  for (const language of languages) {
    const region = new Intl.Locale(language).maximize().region;
    if (region && supported.has(region)) return region;
  }
  return STORE_DEFAULTS.country;
}
