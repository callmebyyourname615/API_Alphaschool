import { IsArray, IsBoolean, IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

export class CreateLessonInfoDto {
  @IsUUID()
  lessonId: string;

  @IsInt()
  @Min(1)
  lessonInfoNo: number;

  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  info?: string;

  @IsBoolean()
  @IsOptional()
  isEvaluation?: boolean;

  @IsInt()
  @Min(0)
  @Max(1000)
  @IsOptional()
  evaluationMaxScore?: number;

  @IsString()
  @IsOptional()
  evaluationSample?: string;

  @IsString()
  @IsOptional()
  infoImage?: string;

  @IsString()
  @IsOptional()
  attachment?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  evaluationItems?: string[];
}