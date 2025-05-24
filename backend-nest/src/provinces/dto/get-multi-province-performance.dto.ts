import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsArray, IsNotEmpty, IsUUID } from 'class-validator';

export class GetMultiProvincePerformanceDto {
  @ApiProperty({
    description: 'Comma-separated list of Province UUIDs or an array of UUIDs.',
    type: 'string',
    example: 'uuid1,uuid2,uuid3',
  })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.split(',').map(id => id.trim());
    }
    if (Array.isArray(value)) {
      return value.map(id => String(id).trim()); // Ensure elements are strings
    }
    return value; // Let validator handle if it's not string or array
  })
  @IsArray()
  @IsUUID('4', { each: true })
  @IsNotEmpty()
  ids: string[];
} 