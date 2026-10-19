import { randomUUID } from 'node:crypto';

import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { type Request, type Response } from 'express';

import { type ApiError } from '@booth/shared';

import { AppException } from './app.exception';
import { errorCodeForStatus } from './error-code-for-status';

/** Renders every error as `{ error: { code, message, details?, requestId } }`. */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();

    const status =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const requestId = typeof request.id === 'string' ? request.id : randomUUID();

    if (status >= 500) {
      this.logger.error({ err: exception, requestId }, 'Unhandled error');
    }

    const body: ApiError = {
      error: {
        code: exception instanceof AppException ? exception.code : errorCodeForStatus(status),
        message: status >= 500 ? 'Internal server error' : messageOf(exception),
        ...(exception instanceof AppException &&
          exception.details && { details: exception.details }),
        requestId,
      },
    };

    response.status(status).json(body);
  }
}

function messageOf(exception: unknown): string {
  if (!(exception instanceof HttpException)) return 'Request failed';
  const payload = exception.getResponse();
  if (typeof payload === 'string') return payload;
  const message = (payload as { message?: unknown }).message;
  if (typeof message === 'string') return message;
  if (Array.isArray(message)) return message.join('; ');
  return exception.message;
}
