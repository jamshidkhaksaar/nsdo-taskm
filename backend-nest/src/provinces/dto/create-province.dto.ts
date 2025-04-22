import { IsNotEmpty, IsString, IsOptional, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProvinceDto {
  @ApiProperty({
    description: 'The name of the province',
    example: 'Ontario',
    maxLength: 255,
  })
  @IsNotEmpty({ message: 'Province name cannot be empty.' })
  @IsString()
  @Length(1, 100)
  name: string;

  @ApiProperty({
    description: 'Optional description for the province',
    example: 'Central Canadian province, home to the capital.',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(0, 255)
  description?: string;
} 