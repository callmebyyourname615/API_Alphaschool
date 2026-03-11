import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Saving } from './savings.entity';
import { SavingService } from './savings.service';
import { SavingsController } from './savings.controller';

import { Student } from '../students/student.entity';
import { Class } from '../classes/class.entity';
import { Branch } from '../branches/branch.entity';
import { AcademicYear } from '../academic_years/academic-year.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Saving, Branch, AcademicYear, Student, Class]),
  ],
  controllers: [SavingsController],
  providers: [SavingService],
})
export class SavingsModule {}
