import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LessonInfosService } from './lesson-infos.service';
import { LessonInfosController } from './lesson-infos.controller';
import { LessonInfo } from './lesson_info.entity';
import { Lesson } from '../lessons/lesson.entity';


@Module({
  imports: [TypeOrmModule.forFeature([LessonInfo, Lesson])],
  controllers: [LessonInfosController],
  providers: [LessonInfosService],
  exports: [LessonInfosService],
})
export class LessonInfosModule {}