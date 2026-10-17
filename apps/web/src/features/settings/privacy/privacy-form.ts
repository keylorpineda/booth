import { z } from 'zod';

import { type Store, type UpdateStoreInput } from '@booth/shared';

export const privacyFormSchema = z.object({
  notice: z.string().trim().min(20, 'validation.tooShort').max(4000, 'validation.tooLong'),
});

export type PrivacyFormInput = z.input<typeof privacyFormSchema>;
export type PrivacyForm = z.output<typeof privacyFormSchema>;

export function toPrivacyForm(store: Store): PrivacyForm {
  return {
    notice: store.privacyNotice ?? store.effectivePrivacyNotice,
  };
}

export function toPrivacyUpdate(values: PrivacyForm): UpdateStoreInput {
  return {
    privacyNotice: values.notice,
  };
}
