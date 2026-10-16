import { type Request } from 'express';

import { type TenantResolver } from './tenant-resolver';

/** MVP strategy: the slug is a route parameter (`/api/public/stores/:slug/...`). */
export class PathTenantResolver implements TenantResolver {
  constructor(private readonly param = 'slug') {}

  resolveSlug(request: Request): string | null {
    const value = request.params[this.param];
    return typeof value === 'string' && value.length > 0 ? value.toLowerCase() : null;
  }
}
