import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEmail, IsOptional, IsString, MinLength, IsUrl, IsArray, IsObject, IsUUID } from 'class-validator';

export class UpdateUserDto {
  @ApiPropertyOptional({ description: 'Updated username for the user', example: 'johndoe88' })
  @IsOptional()
  @IsString()
  @MinLength(3)
  username?: string;

  @ApiPropertyOptional({ description: 'Updated email address for the user', example: 'john.doe88@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  // Password should NOT be updated via this DTO. Use a separate password reset/change flow.

  // @ApiPropertyOptional({ description: 'Updated role name (e.g., \'user\', \'admin\')', example: 'admin' })
  // @IsOptional()
  // @IsString()
  // roleName?: string; // Service uses roleId for updates

  @ApiPropertyOptional({ description: 'ID of the new role to assign to the user', example: 'uuid-for-role' })
  @IsOptional()
  @IsUUID()
  roleId?: string;

  // Removed firstName and lastName as they are not direct User entity fields
  // @ApiPropertyOptional({ description: 'Updated user\'s first name', example: 'Jonathan' })
  // @IsOptional()
  // @IsString()
  // firstName?: string;

  // @ApiPropertyOptional({ description: 'Updated user\'s last name', example: 'Doer' })
  // @IsOptional()
  // @IsString()
  // lastName?: string;

  @ApiPropertyOptional({ description: 'Set user account active status', example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'User\'s job position or title', example: 'Software Engineer' })
  @IsOptional()
  @IsString()
  position?: string;

  @ApiPropertyOptional({ description: 'A short biography for the user', example: 'Loves coding and coffee.' })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiPropertyOptional({ description: 'URL to the user\'s avatar image', example: 'https://example.com/avatar.png' })
  @IsOptional()
  @IsString()
  @IsUrl()
  avatarUrl?: string;

  @ApiPropertyOptional({ description: 'List of user skills', example: ['nestjs', 'react', 'typescript'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skills?: string[];

  @ApiPropertyOptional({ description: 'User\'s social media links', example: { twitter: 'johndoe', linkedin: 'johndoe' } })
  @IsOptional()
  @IsObject() // Add more specific validation if structure is strictly defined
  socialLinks?: Record<string, string>;

  @ApiPropertyOptional({ description: 'User-specific preferences', example: { theme: 'dark', notifications: true } })
  @IsOptional()
  @IsObject() // Add more specific validation if structure is strictly defined
  preferences?: Record<string, any>;

  // Add other optional fields like departmentId etc. that can be updated
} 