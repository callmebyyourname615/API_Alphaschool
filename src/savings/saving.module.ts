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
import { SaveWithdrawReason } from '../save_withdraw_resson/save-withdraw-reason.entity';
import { SavingSession } from './saving-session.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Saving,
      SavingSession, 
      Student,
      Class,
      Branch,
      AcademicYear,
      PayReceive,
      SaveWithdrawReason,
    ]),
  ],
  controllers: [SavingsController],
  providers: [SavingsService],
  exports: [SavingsService],
})
export class SavingsModule {}