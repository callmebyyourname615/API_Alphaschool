import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Examination } from './examination.entity';
import { ExaminationService } from './examination.service';
import { ExaminationController } from './examination.controller';
import { Student } from '../students/student.entity';
import { Subject } from '../subjects/subject.entity';
import { Branch } from '../branches/branch.entity';
import { Admin } from '../admins/admin.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Examination,
      Branch,
      Student,
      Subject,
      Admin,
    ]),
  ],
  controllers: [ExaminationController],
  providers: [ExaminationService],
})
export class ExaminationModule {}
