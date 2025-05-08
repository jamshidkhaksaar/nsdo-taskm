import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';

// Define an enum for allowed 2FA methods if you have a fixed set
// export enum TwoFactorMethod {
//   APP = 'app',
//   EMAIL = 'email',
//   SMS = 'sms',
// }

export class SetupTwoFactorDto {
  @ApiProperty({
    description: 'Whether to enable or disable Two-Factor Authentication.',
    example: true,
  })
  @IsBoolean()
  enabled: boolean;

  @ApiProperty({
    description: 'The method for 2FA (e.g., \'app\', \'email\'). Defaults to \'app\' if not provided.',
    example: 'app',
    required: false,
    // enum: TwoFactorMethod, // Uncomment if using the enum
  })
  @IsOptional()
  @IsString() // Or @IsEnum(TwoFactorMethod) if using the enum
  method?: string; // Or method?: TwoFactorMethod;
} 