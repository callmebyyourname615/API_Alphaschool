import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppointmentPersonController } from './appointment-person.controller';
import { AppointmentPersonService } from './appointment-person.service';
import { AppointmentPerson } from './appointment-person.entity';
import { Appointment } from '../appointment/appointment.entity';
import { Branch } from '../branches/branch.entity';
import { AcademicYear } from '../academic_years/academic-year.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AppointmentPerson,
      Appointment,
      Branch,
      AcademicYear,
    ]),
  ],
  providers: [AppointmentPersonService],
  controllers: [AppointmentPersonController],
})
export class AppointmentPersonModule {}
