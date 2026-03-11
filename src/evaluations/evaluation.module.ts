import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EvaluationService } from './evaluation.service';
import { EvaluationController } from './evaluation.controller';
import { Evaluation } from './evaluation.entity';
import { Subject } from '../subjects/subject.entity';
import { Lesson } from '../lessons/lesson.entity';
import { Class } from '../classes/class.entity';
import { Student } from '../students/student.entity';
import { LessonInfo } from '../lesson-infos/lesson_info.entity';
import { Admin } from '../admins/admin.entity';

@Module({
  imports: [TypeOrmModule.forFeature([
    Evaluation,
    Subject,
    Lesson,
    LessonInfo,
    Admin,
    Class,
    Student
  ])],
  providers: [EvaluationService],
  controllers: [EvaluationController],
})
export class EvaluationModule {}
