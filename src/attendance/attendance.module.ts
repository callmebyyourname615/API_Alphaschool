import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Attendance } from './attendance.entity';
import { Student } from '../students/student.entity';
import { Admin } from '../admins/admin.entity';
import { AttendancesController } from './attendance.controller';
import { AttendancesService } from './attendance.service';

@Module({
  imports: [TypeOrmModule.forFeature([Attendance, Student, Admin])],
  controllers: [AttendancesController],
  providers: [AttendancesService],
  exports: [AttendancesService],
})
export class AttendancesModule {}