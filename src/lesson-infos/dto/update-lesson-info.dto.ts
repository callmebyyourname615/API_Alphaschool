// src/lesson-infos/dto/update-lesson-info.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateLessonInfoDto } from './create-lesson-info.dto';

export class UpdateLessonInfoDto extends PartialType(CreateLessonInfoDto) {}