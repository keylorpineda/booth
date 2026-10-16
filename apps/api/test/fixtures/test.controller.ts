import { Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { z } from 'zod';

import { minorUnitsSchema } from '@booth/shared';

import { Public } from '../../src/auth/decorators/public.decorator';
import { AppException } from '../../src/common/errors/app.exception';
import { RateLimit } from '../../src/common/rate-limit/rate-limit.decorator';
import { ZodBody } from '../../src/common/validation/zod.decorators';

export const echoSchema = z.object({
  name: z.string().min(2),
  priceMinor: minorUnitsSchema,
});

/** Routes that exercise cross-cutting behavior. Mounted only in e2e tests. */
@Public()
@Controller('test')
export class TestController {
  @Post('echo')
  @HttpCode(HttpStatus.OK)
  echo(@ZodBody(echoSchema) body: z.infer<typeof echoSchema>): z.infer<typeof echoSchema> {
    return body;
  }

  @Get('ping')
  ping(): { ok: true } {
    return { ok: true };
  }

  @Get('auth-ping')
  @RateLimit('auth')
  authPing(): { ok: true } {
    return { ok: true };
  }

  @Get('conflict')
  conflict(): never {
    throw new AppException('CONFLICT', 'Slug already taken', HttpStatus.CONFLICT, {
      field: 'slug',
    });
  }

  @Get('boom')
  boom(): never {
    throw new Error('database password is hunter2');
  }
}
