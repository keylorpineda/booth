import { z } from 'zod';

import { RESERVED_SLUGS, SLUG_MAX_LENGTH, SLUG_MIN_LENGTH, SLUG_PATTERN } from './slug-rules';

export const slugSchema = z
  .string()
  .trim()
  .min(SLUG_MIN_LENGTH)
  .max(SLUG_MAX_LENGTH)
  .regex(SLUG_PATTERN, 'Use lowercase letters, numbers and single hyphens')
  .refine((slug) => !RESERVED_SLUGS.has(slug), 'This name is reserved');
