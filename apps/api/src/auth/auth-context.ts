import { type StoreRole } from '@booth/shared';

/** Who is calling. Set on `req.auth` by JwtAuthGuard from the database, never from the client. */
export interface AuthContext {
  userId: string;
  isDemo: boolean;
  /** The active store for the member, or null before onboarding. */
  storeId: string | null;
  /** The role in the active store, or null if no store. */
  role: StoreRole | null;
}

declare module 'express' {
  interface Request {
    auth?: AuthContext;
  }
}
