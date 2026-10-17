import { z } from 'zod';

import { type Store, toE164, type UpdateStoreInput } from '@booth/shared';

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

/** Form-shaped profile schema: i18n keys as messages, E.164 phone checked against the store country. */
export function profileFormSchema(country: string) {
  return z
    .object({
      name: z.string().trim().min(2, 'validation.tooShort').max(80, 'validation.tooLong'),
      description: z.string().trim().max(500, 'validation.tooLong'),
      whatsappPhone: z.string().trim().min(1, 'validation.required'),
      pricesNote: z.string().trim().max(160, 'validation.tooLong'),
      brandColor: z
        .string()
        .trim()
        .regex(HEX_COLOR, 'validation.hexColor')
        .transform((value) => value.toUpperCase()),
    })
    .superRefine((form, ctx) => {
      if (!toE164(form.whatsappPhone, country)) {
        ctx.addIssue({ code: 'custom', path: ['whatsappPhone'], message: 'validation.phone' });
      }
    });
}

export type ProfileFormInput = z.input<ReturnType<typeof profileFormSchema>>;
export type ProfileForm = z.output<ReturnType<typeof profileFormSchema>>;

export function toProfileForm(store: Store): ProfileFormInput {
  return {
    name: store.name,
    description: store.description ?? '',
    whatsappPhone: store.whatsappPhone,
    pricesNote: store.pricesNote ?? '',
    brandColor: store.brandColor,
  };
}

export function toProfileUpdate(form: ProfileForm, country: string): UpdateStoreInput {
  return {
    name: form.name,
    description: form.description === '' ? null : form.description,
    whatsappPhone: toE164(form.whatsappPhone, country) ?? form.whatsappPhone,
    pricesNote: form.pricesNote === '' ? null : form.pricesNote,
    brandColor: form.brandColor,
  };
}

/** True when a typed string is a 6-digit hex color (`#RRGGBB`). */
export function isValidHexColor(value: string): boolean {
  return HEX_COLOR.test(value.trim());
}
