import { IsArray, IsNotEmpty, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignDepartmentsDto {
  @ApiProperty({
    description: 'An array of Department UUIDs to assign to the province',
    example: ['uuid-for-dept-1', 'uuid-for-dept-2'],
    type: [String],
  })
  @IsArray()
  @IsNotEmpty({ each: true })
  @IsUUID('4', { each: true, message: 'Each department ID must be a valid UUID.' })
  departmentIds: string[];
} 