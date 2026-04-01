import { Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateTeacherHomeworkItemDto {
  @IsString()
  @MaxLength(255)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  teacherGuidePage?: string;

  @IsOptional()
  @IsString()
  itemInstruction?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  sortOrder?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  score?: number;
}