import { Type } from 'class-transformer';
import { IsString, IsUUID, IsOptional, IsArray, ValidateNested } from 'class-validator';

export class ContentDto {
  @IsString()
  t_title: string;

  @IsString()
  t_page: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  e_title?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  e_page?: string[];
}

export class CreateSubjectEvaluationDto {
  @IsUUID()
  subject_id: string;

  @IsString()
  topic: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ContentDto)
  contents: ContentDto[];
}