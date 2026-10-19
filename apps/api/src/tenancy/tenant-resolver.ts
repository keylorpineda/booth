import { type Request } from 'express';

/**
 * Finds the store slug for a public request. Strategies are tried in order, so a subdomain
 * resolver (`slug.domain.com`) can be added later without touching controllers.
 */
export interface TenantResolver {
  resolveSlug(request: Request): string | null | Promise<string | null>;
}

export const TENANT_RESOLVERS = Symbol('TENANT_RESOLVERS');

/** The store a public request belongs to. */
export interface Tenant {
  storeId: string;
  slug: string;
}

declare module 'express' {
  interface Request {
    tenant?: Tenant;
  }
}
