import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class ResendLoginOtpDto {
  @ApiProperty({
    description: 'The ID of the user for whom to resend the OTP.',
    example: 'clyu4x0q70000u09j1f2g3h4i',
  })
  @IsString()
  @IsNotEmpty()
  userId: string;
} 