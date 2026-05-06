import {
  IsOptional,
  IsString,
  IsEmail,
  IsUUID,
  IsBoolean,
  IsDateString,
  IsArray,
  MinLength,
} from 'class-validator';

export class UpdateAdminDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  username?: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string; // Note: better to handle password change in separate endpoint

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsDateString()
  join_date?: string;

  @IsOptional()
  @IsString()
  first_name?: string;

  @IsOptional()
  @IsString()
  last_name?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  tell?: string;

  @IsOptional()
  @IsDateString()
  dob?: string;

  @IsOptional()
  @IsString()
  gender?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  village?: string;

  @IsOptional()
  @IsString()
  district?: string;

  @IsOptional()
  @IsString()
  province?: string;

  @IsOptional()
  @IsString()
  home_picture_url?: string;

  @IsOptional()
  @IsString()
  home_address?: string;

  @IsOptional()
  @IsString()
  current_academic_year?: string;

  // ────────────────────────────────────────────────────────
  // Changed from role_id → role_ids (array, consistent with create)
  // ────────────────────────────────────────────────────────
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true }) // each item must be valid UUID v4
  role_ids?: string[];

  @IsOptional()
  @IsUUID()
  branch_id?: string; // <-- Add this// ← plural + array

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @IsOptional()
  @IsBoolean()
  is_deleted?: boolean;

  @IsOptional()
  @IsString()
  profile_pic?: string;
}
