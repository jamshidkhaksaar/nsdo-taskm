import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ description: 'Username for the new user', example: 'johndoe' })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  username: string;

  @ApiProperty({ description: 'Email address for the new user', example: 'john.doe@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ description: 'Password for the new user', example: 'P@$$wOrd123' })
  @IsString()
  @IsNotEmpty()
  @MinLength(8) // Enforce minimum password length
  password: string;

  @ApiPropertyOptional({ description: 'Name of the role to assign (e.g., \'user\', \'admin\')', example: 'user' })
  @IsOptional()
  @IsString()
  roleName?: string; // Service should handle finding Role entity by name

  // Removed firstName and lastName as they are not directly used by the User entity or creation service
  // @ApiPropertyOptional({ description: 'User\'s first name', example: 'John' })
  // @IsOptional()
  // @IsString()
  // firstName?: string;

  // @ApiPropertyOptional({ description: 'User\'s last name', example: 'Doe' })
  // @IsOptional()
  // @IsString()
  // lastName?: string;

  // Add other optional fields like position, departmentId etc. if needed during creation
} 