import { IsString, IsNotEmpty, IsUUID, IsBoolean, IsOptional } from "class-validator";

export class LoginTwoFactorDto {
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  verificationCode: string;

  @IsOptional()
  @IsBoolean()
  rememberDevice?: boolean;
}
