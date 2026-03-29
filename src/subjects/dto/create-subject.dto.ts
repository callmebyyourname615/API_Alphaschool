import { IsString, IsUUID, IsOptional, IsInt } from 'class-validator';

export class CreateSubjectDto {
  @IsUUID()
  subject_type_id: string;

  @IsUUID()
  class_id: string;

    @IsUUID()
  @IsOptional()
  curriculum_id?: string; // ✅ add this

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  file_s?: string | null;

  @IsOptional()
  @IsString()
  s_year?: string | null;

  @IsOptional()
  @IsString()
  t_year?: string | null;

  @IsOptional()
  @IsString()
  file_t?: string | null;

  @IsOptional()
  @IsString()
  file_e?: string | null;
}
