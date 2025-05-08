import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class InitiatePasswordResetDto {
  @ApiProperty({
    description: 'The email address of the user requesting a password reset.',
    example: 'user@example.com',
  })
  @IsNotEmpty()
  @IsEmail()
  email: string;
} 