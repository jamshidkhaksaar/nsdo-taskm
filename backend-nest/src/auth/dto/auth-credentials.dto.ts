import { IsString, IsOptional, IsNotEmpty, IsBoolean } from "class-validator";

export class LoginCredentialsDto {
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsString()
  @IsNotEmpty()
  captchaToken: string;

  @IsOptional()
  @IsString()
  fingerprint?: string;

  @IsOptional()
  @IsString()
  verification_code?: string;

  @IsOptional()
  @IsBoolean()
  remember_me?: boolean;
}
