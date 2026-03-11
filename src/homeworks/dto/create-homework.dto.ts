import { IsString, IsOptional, IsUUID, IsNumber, IsDateString } from 'class-validator';
import { TaskDto } from '../../task/dto/task.dto';

export class CreateHomeworkDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  score?: number;

  @IsOptional()
  @IsDateString()
  deadline?: string;

  @IsUUID()
  teachingId: string;

  @IsOptional()
  @IsUUID()
  lessonId?: string;

  @IsOptional()
  @IsUUID()
  lessonInfoId?: string;

  @IsUUID()
  branchId: string;

  @IsOptional()
  tasks?: TaskDto[];
}
