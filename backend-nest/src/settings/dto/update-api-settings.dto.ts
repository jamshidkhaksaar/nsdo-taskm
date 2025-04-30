import { IsOptional, IsBoolean, IsString, IsNumber } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class UpdateApiSettingsDto {
  @ApiProperty({ description: "Enable API access", required: false })
  @IsOptional()
  @IsBoolean()
  api_enabled?: boolean;

  @ApiProperty({
    description: "API key for external integrations",
    required: false,
  })
  @IsOptional()
  @IsString()
  api_key?: string;

  @ApiProperty({
    description: "Enable WeatherAPI.com integration",
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  weather_api_enabled?: boolean;

  @ApiProperty({ description: "WeatherAPI.com API key", required: false })
  @IsOptional()
  @IsString()
  weather_api_key?: string;

  @ApiProperty({ description: "Maximum requests per minute", required: false })
  @IsOptional()
  @IsNumber()
  api_rate_limit?: number;

  @ApiProperty({
    description: "Comma-separated list of allowed IP addresses",
    required: false,
  })
  @IsOptional()
  @IsString()
  api_allowed_ips?: string;
}
