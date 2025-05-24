import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional } from 'class-validator';

export class SendEmailCodeDto {
  @ApiProperty({
    description: 'The email address to send the 2FA code to. If not provided, the user\'s primary email will be used.',
    example: 'user@example.com',
    required: false,
  })
  @IsOptional()
  @IsEmail()
  email?: string;
} 