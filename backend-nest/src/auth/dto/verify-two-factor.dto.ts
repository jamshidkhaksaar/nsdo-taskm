import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class VerifyTwoFactorDto {
  @ApiProperty({
    description: 'The 2FA verification code from the authenticator app or email.',
    example: '123456',
  })
  @IsString()
  @IsNotEmpty()
  verification_code: string;

  @ApiProperty({
    description: 'Whether to remember this browser for future 2FA bypass during setup verification.',
    example: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  remember_browser?: boolean;
}