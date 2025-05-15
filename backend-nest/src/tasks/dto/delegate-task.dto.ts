import { ApiProperty } from '@nestjs/swagger';
import { IsArray, ArrayNotEmpty, IsMongoId } from 'class-validator';

export class DelegateTaskDto {
  @ApiProperty({
    description: 'Array of user IDs to delegate the task to.',
    type: [String],
    example: ['60f7e6f3b5f9d62f8c5e4a2b', '60f7e6f3b5f9d62f8c5e4a2c'],
  })
  @IsArray()
  @ArrayNotEmpty({ message: 'At least one user ID must be provided for delegation.' })
  @IsMongoId({ each: true, message: 'Each delegated user ID must be a valid MongoDB ObjectId.' })
  delegatedToUserIds: string[];
}
