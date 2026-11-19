import { z } from 'zod';

/** `GET /health`: the process is up. Never touches the database (see the controller). */
export const livenessResponseSchema = z.object({ status: z.literal('ok') });

export type LivenessResponse = z.infer<typeof livenessResponseSchema>;

/** `GET /health/db`: the process can reach the database. */
export const healthResponseSchema = z.object({
  status: z.enum(['ok', 'error']),
  db: z.enum(['up', 'down']),
});

export type HealthResponse = z.infer<typeof healthResponseSchema>;
