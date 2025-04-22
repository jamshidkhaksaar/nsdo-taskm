import { IsString, IsOptional, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateProvinceDto {
  @ApiProperty({
    description: 'The updated name of the province',
    example: 'Ontario',
    required: false,
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  name?: string;

  @ApiProperty({
    description: 'Updated optional description for the province',
    example: 'Canada\'s most populous province.',
    required: false,
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @Length(0, 255)
  description?: string;
} 