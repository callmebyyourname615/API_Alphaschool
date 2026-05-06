import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Examination } from './examination.entity';
import { ExaminationService } from './examination.service';
import { ExaminationController } from './examination.controller';
import { Subject } from '../subjects/subject.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Examination, Subject])],
  controllers: [ExaminationController],
  providers: [ExaminationService],
  exports: [ExaminationService],
})
export class ExaminationModule {}