import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class UpdatePasswordDto {
  @ApiProperty({
    description: 'The user\'s current password.',
    example: 'currentP@$$wOrd',
  })
  @IsString()
  @IsNotEmpty()
  currentPassword: string;

  @ApiProperty({
    description: 'The new password for the user. Should meet complexity requirements.',
    example: 'newP@$$wOrd123',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8) // Example: Enforce minimum length
  // Add @Matches(/regex/) for complexity if needed
  newPassword: string;
} 