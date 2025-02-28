import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class LoginCredentialsDto {
  @IsString()
  username: string;

  @IsString()
  password: string;
  
  @IsOptional()
  @IsString()
  verification_code?: string;
  
  @IsOptional()
  @IsBoolean()
  remember_me?: boolean;
} 