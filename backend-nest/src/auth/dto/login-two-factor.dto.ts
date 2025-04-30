import { IsString, IsNotEmpty, IsUUID } from "class-validator";

export class LoginTwoFactorDto {
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  verificationCode: string;
}
