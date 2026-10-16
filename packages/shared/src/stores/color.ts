import { z } from 'zod';

export const hexColorSchema = z
  .string()
  .trim()
  .regex(/^#[0-9a-fA-F]{6}$/, 'Use a 6-digit hex color like #E85D3A')
  .transform((value) => value.toUpperCase());
