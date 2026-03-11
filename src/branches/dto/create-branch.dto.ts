import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class CreateBranchDto {
  @IsString()
  branch_id: string;

  @IsString()
  name: string;

  @IsOptional()
  address?: Record<string, any>;

  @IsString()
  contact: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
