import { IsNotEmpty, IsOptional, IsString, IsUUID } from "class-validator";

export class CreateDepartmentDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsUUID("4") // Validate as UUID
  head?: string;

  @IsOptional()
  @IsUUID("4") // Validate as UUID
  provinceId?: string;
}
