import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateNoteDto {
  @ApiProperty({
    description: 'The content of the note',
    example: 'Remember to complete the project report',
  })
  @IsNotEmpty()
  @IsString()
  content: string;

  @ApiProperty({
    description: 'The color of the note (CSS color)',
    example: '#3498db',
    required: false,
  })
  @IsOptional()
  @IsString()
  color?: string;
} 