import { IsString, IsNotEmpty, IsOptional } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class SettingDto {
  @ApiProperty({
    description: "The unique key for the setting",
    example: "SENDGRID_API_KEY",
  })
  @IsString()
  @IsNotEmpty()
  key: string;

  @ApiProperty({
    description: "The value of the setting",
    example: "SG.xxxxxxxx",
  })
  @IsString()
  @IsNotEmpty()
  value: string;

  @ApiProperty({
    description: "Optional description for the setting",
    example: "API Key for SendGrid email service",
  })
  @IsString()
  @IsOptional()
  description?: string;
}

export class UpdateSettingsDto {
  @ApiProperty({
    type: [SettingDto],
    description: "An array of settings to update",
  })
  settings: SettingDto[];
}
