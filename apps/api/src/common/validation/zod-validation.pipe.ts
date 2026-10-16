import { HttpStatus, type PipeTransform } from '@nestjs/common';
import { type ZodType } from 'zod';

import { type FieldError } from '@booth/shared';

import { AppException } from '../errors/app.exception';

/** Validates and parses a value with a Zod schema from @booth/shared. */
export class ZodValidationPipe<T> implements PipeTransform<unknown, T> {
  constructor(private readonly schema: ZodType<T>) {}

  transform(value: unknown): T {
    const result = this.schema.safeParse(value);
    if (result.success) return result.data;

    const fields: FieldError[] = result.error.issues.map((issue) => ({
      path: issue.path.join('.'),
      message: issue.message,
    }));
    throw new AppException('VALIDATION_ERROR', 'Invalid request', HttpStatus.BAD_REQUEST, {
      fields,
    });
  }
}
