import { IsString, IsNotEmpty, MaxLength, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class EmailTemplateDto {
  @ApiProperty({ 
    description: 'Unique identifier for the template (used in code)',
    example: 'PASSWORD_RESET' 
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  templateKey: string;

  @ApiProperty({ 
    description: 'Subject line for the email (can use placeholders like {{username}})',
    example: 'Password Reset Request for {{appName}}' 
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  subject: string;

  @ApiProperty({ 
    description: 'HTML body content for the email (can use placeholders like {{link}})',
    example: '<p>Hello {{username}}, click <a href="{{link}}">here</a> to reset your password.</p>'
  })
  @IsString()
  @IsNotEmpty()
  bodyHtml: string;

  @ApiProperty({ 
    description: 'Optional description of the template\'s purpose',
    example: 'Sent when a user requests a password reset.'
  })
  @IsString()
  @IsOptional()
  description?: string;
}

// We might only allow updating subject/body/description, not the key
export class UpdateEmailTemplateDto {
  @ApiProperty({ description: 'Subject line for the email' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  @IsOptional() // Make fields optional for partial updates
  subject?: string;

  @ApiProperty({ description: 'HTML body content for the email' })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  bodyHtml?: string;

  @ApiProperty({ description: 'Optional description of the template\'s purpose' })
  @IsString()
  @IsOptional()
  description?: string;
} 