import { IsString, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateProvinceDto {
  @ApiProperty({
    description: 'The updated name of the province',
    example: 'Ontario',
    required: false,
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @ApiProperty({
    description: 'Updated optional description for the province',
    example: 'Canada\'s most populous province.',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;
} 