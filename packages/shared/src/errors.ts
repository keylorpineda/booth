import { z } from 'zod';

/** Machine-readable error codes. The web app maps each code to a localized message. */
export const ERROR_CODES = [
  'VALIDATION_ERROR',
  'BAD_REQUEST',
  'UNAUTHENTICATED',
  'FORBIDDEN',
  'NOT_FOUND',
  'CONFLICT',
  'PAYLOAD_TOO_LARGE',
  'UNSUPPORTED_MEDIA_TYPE',
  'RATE_LIMITED',
  'SERVICE_UNAVAILABLE',
  'INTERNAL_ERROR',
  // Auth
  'EMAIL_TAKEN',
  'INVALID_CREDENTIALS',
  'INVALID_REFRESH_TOKEN',
  'REFRESH_TOKEN_REUSED',
  'DEMO_READ_ONLY',
  // Stores
  'ONBOARDING_REQUIRED',
  'STORE_ALREADY_EXISTS',
  'SLUG_TAKEN',
  // Catalog and media
  'CATEGORY_NAME_TAKEN',
  'TOO_MANY_IMAGES',
  'FILE_TOO_LARGE',
  'UNSUPPORTED_FILE_TYPE',
  'MEDIA_NOT_CONFIGURED',
] as const;

export type ErrorCode = (typeof ERROR_CODES)[number];

export const fieldErrorSchema = z.object({
  path: z.string(),
  message: z.string(),
});

export type FieldError = z.infer<typeof fieldErrorSchema>;

/** Shape of every error response: `{ error: { code, message, details?, requestId } }`. */
export const apiErrorSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.record(z.string(), z.unknown()).optional(),
    requestId: z.string(),
  }),
});

export type ApiError = z.infer<typeof apiErrorSchema>;
