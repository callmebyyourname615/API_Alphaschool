import { IsString, IsUUID } from 'class-validator';

export class CreateSubjectDto {
  @IsString()
  name: string;

  @IsUUID()
  branch_id: string;
}
