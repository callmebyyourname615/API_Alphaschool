import { IsString, IsOptional, IsArray } from 'class-validator';

export class CreateBranchDto {

  @IsString()
  branch_id: string;

  @IsOptional()
  name?: string;

  @IsOptional()
  contact?: string;

  @IsOptional()
  phone?: string;

  @IsOptional()
  address?: Record<string, any>;

  @IsOptional()
  @IsArray()
  subjects?: string[];

}