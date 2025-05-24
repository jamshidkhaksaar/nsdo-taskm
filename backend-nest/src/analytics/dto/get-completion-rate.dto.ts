import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';

export enum AnalyticsPeriod {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
}

export class GetCompletionRateDto {
  @ApiPropertyOptional({
    description: 'The time period for calculating the completion rate.',
    enum: AnalyticsPeriod,
    default: AnalyticsPeriod.WEEKLY,
    example: AnalyticsPeriod.WEEKLY,
  })
  @IsOptional()
  @IsEnum(AnalyticsPeriod)
  period?: AnalyticsPeriod = AnalyticsPeriod.WEEKLY;
} 