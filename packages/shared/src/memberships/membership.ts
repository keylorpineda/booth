import { z } from 'zod';

import { emailSchema, passwordSchema } from '../auth';
import { type StoreRole, storeRoleSchema } from './roles';

export { storeRoleSchema, type StoreRole };

export const storeMemberUserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
});
export type StoreMemberUser = z.infer<typeof storeMemberUserSchema>;

export const storeMembershipSchema = z.object({
  id: z.string(),
  userId: z.string(),
  storeId: z.string(),
  role: storeRoleSchema,
  user: storeMemberUserSchema,
  createdAt: z.string(),
});
export type StoreMembership = z.infer<typeof storeMembershipSchema>;

export const storeInvitationSchema = z.object({
  id: z.string(),
  storeId: z.string(),
  email: emailSchema,
  role: storeRoleSchema,
  token: z.string(),
  expiresAt: z.string(),
  acceptedAt: z.string().nullable(),
  createdAt: z.string(),
});
export type StoreInvitation = z.infer<typeof storeInvitationSchema>;

export const createInvitationInputSchema = z.object({
  email: emailSchema,
  role: z.enum(['STAFF', 'CATALOG_MANAGER']),
});
export type CreateInvitationInput = z.infer<typeof createInvitationInputSchema>;

export const acceptInvitationInputSchema = z.object({
  name: z.string().trim().min(1).max(80),
  password: passwordSchema,
});
export type AcceptInvitationInput = z.infer<typeof acceptInvitationInputSchema>;

export const publicInvitationInfoSchema = z.object({
  storeName: z.string(),
  storeSlug: z.string(),
  email: z.string(),
  role: storeRoleSchema,
  expiresAt: z.string(),
});
export type PublicInvitationInfo = z.infer<typeof publicInvitationInfoSchema>;
