import { z } from 'zod';

import { type ApiError, type FieldError } from './errors';

export const fieldErrorSchema: z.ZodType<FieldError> = z.object({
  path: z.string(),
  message: z.string(),
});

export const apiErrorSchema: z.ZodType<ApiError> = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.record(z.string(), z.unknown()).optional(),
    requestId: z.string(),
  }),
});
