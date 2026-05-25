// src/save_withdraw_reason/dto/save-withdraw-reason.dto.ts
import { IsString, IsOptional, IsBoolean, MaxLength } from 'class-validator';

export class CreateSaveWithdrawReasonDto {
  @IsString()
  @MaxLength(255)
  nameLao: string;

  @IsString()
  @MaxLength(255)
  nameEn: string;

  @IsOptional()
  @IsBoolean()
  status?: boolean;
}

export class UpdateSaveWithdrawReasonDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  nameLao?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  nameEn?: string;

  @IsOptional()
  @IsBoolean()
  status?: boolean;
}