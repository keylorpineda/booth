import { Controller, Get } from '@nestjs/common';

import { type HealthResponse } from '@booth/shared';

@Controller('health')
export class HealthController {
  // Database connectivity is added to this check in Phase 1.
  @Get()
  check(): HealthResponse {
    return { status: 'ok' };
  }
}
