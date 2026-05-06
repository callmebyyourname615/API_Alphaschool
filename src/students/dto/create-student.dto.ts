import {
  IsString,
  IsUUID,
  IsDateString,
  IsOptional,
  IsBoolean,
  IsArray,
} from 'class-validator';

export class CreateStudentDto {
  @IsUUID()
  branchId: string;

  @IsUUID()
  @IsOptional()
  provinceId?: string;

  @IsUUID()
  @IsOptional()
  districtId?: string;

  @IsString()
  student_id: string;

  @IsString()
  @IsOptional()
  village_id?: string;

  @IsString()
  @IsOptional()
  profile_image_path?: string;

  @IsString()
  first_name: string;

  @IsString()
  last_name: string;

  @IsDateString()
  dob: string;

  @IsString()
  gender: string;

  @IsString()
  @IsOptional()
  nationality?: string;

  @IsString()
  @IsOptional()
  ethnicity?: string;

  @IsString()
  @IsOptional()
  religion?: string;

  @IsString()
  @IsOptional()
  live_with?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsOptional()
  emergency_contacts?: any;

  @IsArray()
  @IsUUID('all', { each: true })
  @IsOptional()
  parentIds?: string[];
}