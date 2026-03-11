import {
  Entity,
  Column,
  PrimaryColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { AppointmentPerson } from '../appointment-person/appointment-person.entity';
import { Branch } from '../branches/branch.entity';
import { AcademicYear } from '../academic_years/academic-year.entity';

@Entity('appointments')
export class Appointment {
  @PrimaryColumn()
  id: string;

  // -----------------------------
  // Foreign Key: branch_id → branches.id
  // -----------------------------
 @Column({ type: 'uuid' })
branch_id: string;

  @ManyToOne(() => Branch, (branch) => branch.appointments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'branch_id' })
  branch: Branch;

  // -----------------------------
  // Foreign Key: academic_year_id → academic_years.id
  // -----------------------------
  @Column()
  academic_year_id: string;

  @ManyToOne(() => AcademicYear, (ay) => ay.appointments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'academic_year_id' })
  academicYear: AcademicYear;

  // -----------------------------
  // Other columns
  // -----------------------------
  @Column()
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column()
  appointment_place: string;

  @Column({ type: 'date' })
  date: Date;

  @Column({ type: 'time' })
  from_time: string;

  @Column({ type: 'time' })
  to_time: string;

  @Column({ type: 'date', nullable: true })
  rescheduled_date: Date;

  @Column({ type: 'time', nullable: true })
  rescheduled_from_time: string;

  @Column({ type: 'time', nullable: true })
  rescheduled_to_time: string;

  @Column()
  auditor_id: string;

  @Column()
  status: string;

  @Column({ default: true })
  is_active: boolean;

  @Column({ default: false })
  is_deleted: boolean;

  @Column({ type: 'timestamp', nullable: true })
  created_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  updated_at: Date;

  @OneToMany(() => AppointmentPerson, (ap) => ap.appointment)
  appointmentPersons: AppointmentPerson[];
}
