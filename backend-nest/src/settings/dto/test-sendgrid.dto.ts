import { IsEmail, IsNotEmpty } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class TestSendGridDto {
  @ApiProperty({
    description: "The email address to send the test email to",
    example: "test@example.com",
  })
  @IsEmail()
  @IsNotEmpty()
  recipientEmail: string;
}
