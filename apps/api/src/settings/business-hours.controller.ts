import { Controller, Get, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { type BusinessHour, type WeeklyHoursInput, weeklyHoursSchema } from '@booth/shared';

import { BusinessHoursService } from './business-hours.service';
import { CurrentStore } from '../auth/decorators/current-store.decorator';
import { ApiZodBody, ZodBody } from '../common/validation/zod.decorators';

@ApiTags('settings')
@ApiBearerAuth()
@Controller('me/business-hours')
export class BusinessHoursController {
  constructor(private readonly hours: BusinessHoursService) {}

  @Get()
  @ApiOperation({ summary: 'Weekly opening intervals (store time zone); empty = always open' })
  list(@CurrentStore() storeId: string): Promise<BusinessHour[]> {
    return this.hours.list(storeId);
  }

  @Put()
  @ApiOperation({ summary: 'Replace the whole week; intervals of a day may not overlap' })
  @ApiZodBody(weeklyHoursSchema)
  replace(
    @CurrentStore() storeId: string,
    @ZodBody(weeklyHoursSchema) body: WeeklyHoursInput,
  ): Promise<BusinessHour[]> {
    return this.hours.replace(storeId, body.hours);
  }
}
