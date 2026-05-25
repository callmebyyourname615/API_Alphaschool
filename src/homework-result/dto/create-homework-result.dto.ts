import {
  IsUUID,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  IsDateString,
} from 'class-validator';

export class CreateHomeworkResultDto {
  @IsUUID()
  @IsNotEmpty()
  homeworkId: string;

  @IsUUID()
  @IsNotEmpty()
  studentId: string;

  @IsUUID()
  @IsOptional()
  classId?: string;

  @IsUUID()
  @IsOptional()
  branchId?: string;

  @IsNumber()
  @Min(0)
  score: number;

  @IsString()
  @IsOptional()
  remark?: string;

  @IsDateString()
  @IsOptional()
  submittedAt?: string;
}
