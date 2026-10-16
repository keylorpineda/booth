import { HttpStatus } from '@nestjs/common';

import { AppException } from './app.exception';

/**
 * Same answer whether the record does not exist or belongs to another store, so ids from other
 * tenants cannot be probed.
 */
export function notFound(entity: string): AppException {
  return new AppException('NOT_FOUND', `${entity} not found`, HttpStatus.NOT_FOUND);
}
