import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { DelegationRequestStatus } from '../entities/task.entity';

export class UpdateDelegationStatusDto {
  @ApiProperty({
    description: 'New status for the delegation request.',
    enum: [DelegationRequestStatus.APPROVED, DelegationRequestStatus.REJECTED],
    example: DelegationRequestStatus.APPROVED,
  })
  @IsEnum([DelegationRequestStatus.APPROVED, DelegationRequestStatus.REJECTED], {
    message: `Status must be either ${DelegationRequestStatus.APPROVED} or ${DelegationRequestStatus.REJECTED}.`,
  })
  @IsNotEmpty()
  status: DelegationRequestStatus.APPROVED | DelegationRequestStatus.REJECTED;

  @ApiPropertyOptional({
    description: 'Reason for rejection (if applicable).',
    type: String,
    example: 'Original assignee is better suited.',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  rejectionReason?: string;
} 