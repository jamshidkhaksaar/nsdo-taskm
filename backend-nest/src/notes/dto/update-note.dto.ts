import { IsOptional, IsString, MaxLength, Matches } from 'class-validator';
import { ApiProperty } from "@nestjs/swagger";

export class UpdateNoteDto {
  @ApiProperty({
    description: "The content of the note",
    example: "Updated note content",
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(10000) // Adjust max length as needed
  content?: string;

  @ApiProperty({
    description: "The color of the note (CSS color)",
    example: "#2ecc71",
    required: false,
  })
  @IsOptional()
  @IsString()
  @Matches(/^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*(?:,\s*([01]?(\.\d+)?))?\s*\)$/,
    {
      message: 'Color must be a valid rgba string (e.g., rgba(25, 118, 210, 0.8)) or a hex color code.'
    }
  )
  color?: string;
}
