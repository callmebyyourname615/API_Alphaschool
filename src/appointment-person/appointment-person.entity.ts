import {
  Entity,
  Column,
  PrimaryColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

import { Appointment } from '../appointment/appointment.entity';
import { Branch } from '../branches/branch.entity';
import { AcademicYear } from '../academic_years/academic-year.entity';

@Entity('appointment_persons')
export class AppointmentPerson {
  @PrimaryColumn({ type: 'varchar', length: 24 })
  id: string;

  // -----------------------------
  // Foreign Key: branch_id → branches.id
  // -----------------------------
  @Column({ type: 'uuid' })
  branch_id: string;

  @ManyToOne(() => Branch, (branch) => branch.appointmentPersons, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'branch_id' })
  branch: Branch;

  // -----------------------------
  // Foreign Key: appointment_id → appointments.id
  // -----------------------------
  @Column({ type: 'varchar', length: 36 })
  appointment_id: string;

  @ManyToOne(() => Appointment, (appt) => appt.appointmentPersons, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'appointment_id' })
  appointment: Appointment;

  // -----------------------------
  // Foreign Key: academic_year_id → academic_years.id
  // -----------------------------
  @Column({ type: 'uuid' })
  academic_year_id: string;

  @ManyToOne(() => AcademicYear, (ay) => ay.appointmentPersons, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'academic_year_id' })
  academicYear: AcademicYear;

  // -----------------------------
  // Other columns
  // -----------------------------
  @Column({ type: 'varchar', length: 36 })
  person_id: string;

  @Column({ type: 'varchar', length: 50 })
  person_type: string;

  @Column({ type: 'varchar', length: 50, default: 'Pending' })
  status: string;

  @Column({ type: 'text' })
  notes: string;

  @Column({ type: 'int', default: 0 })
  declined_count: number;

  @Column({ type: 'int', default: 0 })
  rescheduled_count: number;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @Column({ type: 'boolean', default: false })
  is_deleted: boolean;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}
