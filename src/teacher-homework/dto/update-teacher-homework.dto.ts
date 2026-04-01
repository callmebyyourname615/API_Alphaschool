import { PartialType } from '@nestjs/mapped-types';
import { CreateTeacherHomeworkDto } from './create-teacher-homework.dto';

export class UpdateTeacherHomeworkDto extends PartialType(
  CreateTeacherHomeworkDto,
) {}