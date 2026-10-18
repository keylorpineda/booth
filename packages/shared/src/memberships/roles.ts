import { z } from 'zod';

export const storeRoleSchema = z.enum(['OWNER', 'STAFF', 'CATALOG_MANAGER']);
export type StoreRole = z.infer<typeof storeRoleSchema>;
