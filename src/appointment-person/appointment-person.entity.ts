// ============================================================
// FILE: src/appointment-person/appointment-person.entity.ts
// ============================================================
import {
  Entity,
  PrimaryColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Branch }       from '../branches/branch.entity';
import { AcademicYear } from '../academic_years/academic-year.entity';
import { PersonType }   from '../appointment/appointment.enum';

@Entity('appointment_persons')
export class AppointmentPerson {
  @PrimaryColumn({ type: 'varchar', length: 24 })
  id: string;

  @Column({ type: 'uuid', nullable: true })
  appointment_id?: string;

  @ManyToOne('Appointment', { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'appointment_id' })
  appointment?: any;

  @Column({ type: 'uuid', nullable: true })
  person_id?: string;

  @Column({ type: 'enum', enum: PersonType, nullable: true })
  person_type?: PersonType;                    // ✅ enum type, not string

  @Column({ type: 'varchar', length: 50, nullable: true })
  status?: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'int', default: 0 })
  declined_count: number;

  @Column({ type: 'int', default: 0 })
  rescheduled_count: number;

  @Column({ type: 'uuid', nullable: true })
  branch_id?: string;

  @ManyToOne(() => Branch, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'branch_id' })
  branch?: Branch;

  @Column({ type: 'uuid', nullable: true })
  academic_year_id?: string;

  @ManyToOne(() => AcademicYear, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'academic_year_id' })
  academicYear?: AcademicYear;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @Column({ type: 'boolean', default: false })
  is_deleted: boolean;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}
