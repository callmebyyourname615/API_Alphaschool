// src/lessons/dto/create-lesson.dto.ts
import { IsString, IsNotEmpty, IsUUID, IsDateString, IsOptional } from 'class-validator';

export class CreateLessonDto {
  @IsUUID()
  @IsNotEmpty()
  teachingId: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsDateString()
  @IsNotEmpty()
  lessonDate: string; // will be parsed to Date
}