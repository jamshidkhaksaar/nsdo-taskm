import { IsNotEmpty, IsString, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProvinceDto {
  @ApiProperty({
    description: 'The name of the province',
    example: 'Ontario',
    maxLength: 255,
  })
  @IsNotEmpty({ message: 'Province name cannot be empty.' })
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiProperty({
    description: 'Optional description for the province',
    example: 'Central Canadian province, home to the capital.',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;
} 