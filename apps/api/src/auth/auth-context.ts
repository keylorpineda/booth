/** Who is calling. Set on `req.auth` by JwtAuthGuard from the database, never from the client. */
export interface AuthContext {
  userId: string;
  isDemo: boolean;
  /** The owner's store, or null before onboarding. */
  storeId: string | null;
}

declare module 'express' {
  interface Request {
    auth?: AuthContext;
  }
}
