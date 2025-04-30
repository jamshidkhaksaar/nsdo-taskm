import { IsNotEmpty, IsString, MinLength } from "class-validator";

export class DeleteTaskDto {
  @IsNotEmpty({ message: "Deletion reason is required" })
  @IsString()
  @MinLength(20, {
    message: "Deletion reason must be at least 20 characters long",
  })
  deletionReason: string;
}
