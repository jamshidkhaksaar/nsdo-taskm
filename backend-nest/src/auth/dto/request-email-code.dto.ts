import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsEmail } from 'class-validator';

export class RequestEmailCodeDto {
  @ApiProperty({
    description: 'The username (often an email) of the user requesting an email code.',
    example: 'user@example.com',
  })
  @IsString()
  @IsNotEmpty()
  // Consider adding @IsEmail() if username is always an email address
  username: string;

  @ApiProperty({
    description: 'The current password of the user.',
    example: 'P@$$wOrd123',
  })
  @IsString()
  @IsNotEmpty()
  password: string;
} 