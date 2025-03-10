import { IsString, MinLength, MaxLength, IsOptional, IsBoolean } from 'class-validator';

export class LoginCredentialsDto {
  @IsString()
  @MinLength(4)
  @MaxLength(20)
  username: string;

  @IsString()
  @MinLength(8)
  @MaxLength(32)
  password: string;
  
  @IsString()
  @IsOptional()
  verification_code?: string;
  
  @IsBoolean()
  @IsOptional()
  remember_me?: boolean;
  
  @IsString()
  @IsOptional()
  fingerprint?: string;
} 