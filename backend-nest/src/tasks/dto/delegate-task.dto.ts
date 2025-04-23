import { IsArray, IsOptional, IsString, IsUUID, ArrayMinSize } from 'class-validator';

export class DelegateTaskDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  newAssigneeUserIds: string[];

  @IsOptional()
  @IsString()
  delegationReason?: string;
} 