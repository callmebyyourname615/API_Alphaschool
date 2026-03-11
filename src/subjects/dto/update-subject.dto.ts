import { IsOptional, IsString, IsUUID } from 'class-validator';

export class UpdateSubjectDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsUUID()
  branch_id?: string;
}
