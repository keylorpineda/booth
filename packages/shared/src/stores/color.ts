import { z } from 'zod';

export const hexColorSchema = z
  .string()
  .trim()
  .regex(/^#[0-9a-fA-F]{6}$/, 'Use a 6-digit hex color like #4F46E5')
  .transform((value) => value.toUpperCase());
