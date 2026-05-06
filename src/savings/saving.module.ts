import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SavingsService } from './savings.service';
import { SavingsController } from './savings.controller';
import { Student } from '../students/student.entity';
import { Class } from '../classes/class.entity';
import { Branch } from '../branches/branch.entity';
import { AcademicYear } from '../academic_years/academic-year.entity';
import { Saving } from './savings.entity';
import { PayReceive } from '../pay_receivce/pay-receive.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Saving,
      Student,
      Class,
      Branch,
      AcademicYear,
      PayReceive,
    ]),
  ],
  controllers: [SavingsController],
  providers: [SavingsService],
  exports: [SavingsService],
})
export class SavingsModule {}