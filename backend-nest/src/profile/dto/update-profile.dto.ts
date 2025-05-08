import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString, IsUrl, Length, IsObject } from 'class-validator';

export class UpdateProfileDto {
  @ApiPropertyOptional({ description: 'User\'s position or title', example: 'Software Developer' })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  position?: string;

  @ApiPropertyOptional({ description: 'Short biography of the user', example: 'Passionate developer...' })
  @IsOptional()
  @IsString()
  @Length(0, 500)
  bio?: string;

  @ApiPropertyOptional({ description: 'URL to the user\'s avatar image', example: 'https://example.com/avatar.jpg' })
  @IsOptional()
  @IsUrl()
  avatarUrl?: string;

  @ApiPropertyOptional({ description: 'List of user skills', example: ['NestJS', 'React', 'TypeScript'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skills?: string[];

  @ApiPropertyOptional({ description: 'User\'s social media links', example: { twitter: 'https://twitter.com/johndoe', linkedin: 'https://linkedin.com/in/johndoe' } })
  @IsOptional()
  @IsObject()
  socialLinks?: Record<string, string>;
} 