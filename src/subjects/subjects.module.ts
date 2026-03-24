import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Subject } from './subject.entity';
import { SubjectController } from './subjects.controller';
import { SubjectService } from './subjects.service';
import { Curriculum } from '../curriculums/curriculum.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Subject, Curriculum])],
  controllers: [SubjectController],
  providers: [SubjectService],
})
export class SubjectModule {}