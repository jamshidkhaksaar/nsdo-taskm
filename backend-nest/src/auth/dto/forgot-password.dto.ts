import { IsEmail, IsNotEmpty } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class ForgotPasswordDto {
  @ApiProperty({
    description: "User's email address",
    example: "user@example.com",
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;
}
