import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID, MaxLength } from 'class-validator';

export class DelegateTaskDto {
  @ApiProperty({
    description: 'User ID of the user to delegate the task to.',
    type: String,
    format: 'uuid',
    example: 'd3b4d7d3-ebc6-4db9-8cb5-6fb1b22255fd',
  })
  @IsUUID('4', { message: 'Delegated user ID must be a valid UUID.' })
  @IsNotEmpty({ message: 'A user ID must be provided for delegation.' })
  delegatedToUserId: string;

  @ApiProperty({
    description: 'Reason for delegating the task.',
    type: String,
    example: 'User has more expertise in this area.',
    maxLength: 500,
  })
  @IsString()
  @IsNotEmpty({ message: 'A reason must be provided for delegation.' })
  @MaxLength(500)
  reason: string;
}
