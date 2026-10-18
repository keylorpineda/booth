import { SetMetadata } from '@nestjs/common';

import { type StoreRole } from '@booth/shared';

export const ROLES_KEY = 'roles';

/**
 * Declares which store roles may access the route or controller.
 * Enforced by `RolesGuard`.
 */
export const Roles = (...roles: StoreRole[]) => SetMetadata(ROLES_KEY, roles);
