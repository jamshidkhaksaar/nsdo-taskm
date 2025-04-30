import { IsOptional, IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class UpdateNoteDto {
  @ApiProperty({
    description: "The content of the note",
    example: "Updated note content",
    required: false,
  })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiProperty({
    description: "The color of the note (CSS color)",
    example: "#2ecc71",
    required: false,
  })
  @IsOptional()
  @IsString()
  color?: string;
}
