import { IsNotEmpty, IsOptional, IsString, MaxLength, IsHexColor, Matches } from 'class-validator';
import { ApiProperty } from "@nestjs/swagger";

export class CreateNoteDto {
  @ApiProperty({
    description: "The content of the note",
    example: "Remember to complete the project report",
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(10000) // Adjust max length as needed
  content: string;

  @ApiProperty({
    description: "The color of the note (CSS color)",
    example: "#3498db",
    required: false,
  })
  @IsOptional()
  @IsString()
  @Matches(/^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*(?:,\s*([01]?(\.\d+)?))?\s*\)$/,
    {
      message: 'Color must be a valid rgba string (e.g., rgba(25, 118, 210, 0.8)) or a hex color code.'
    }
  )
  // Alternatively, for hex or more color types, you might use a more complex regex or a library
  // For simplicity, we'll keep the rgba pattern from the frontend default colors.
  // If hex is also allowed: @Matches(/^#(?:[0-9a-fA-F]{3}){1,2}$|^rgba?\((?:\s*\d+\s*,){2}\s*\d+(?:\s*,\s*\d*\.?\d+)?\)$/)
  color?: string;
}
