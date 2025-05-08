import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';

// Example enum for themes
export enum UserTheme {
  LIGHT = 'light',
  DARK = 'dark',
  SYSTEM = 'system',
}

export class UpdateUserSettingsDto {
  @ApiPropertyOptional({
    description: 'Enable/disable email notifications.',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  emailNotificationsEnabled?: boolean;

  @ApiPropertyOptional({
    description: 'Enable/disable push notifications.',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  pushNotificationsEnabled?: boolean;

  @ApiPropertyOptional({
    description: 'User interface theme preference.',
    enum: UserTheme,
    example: UserTheme.DARK,
  })
  @IsOptional()
  @IsEnum(UserTheme)
  theme?: UserTheme;

  // Add other user-specific settings fields here
} 