import { HttpException, HttpStatus } from '@nestjs/common';

import { type ErrorCode } from '@booth/shared';

/** Domain error with a stable code. Rendered by AllExceptionsFilter in the standard format. */
export class AppException extends HttpException {
  constructor(
    readonly code: ErrorCode,
    message: string,
    status: HttpStatus,
    readonly details?: Record<string, unknown>,
  ) {
    super(message, status);
  }
}
