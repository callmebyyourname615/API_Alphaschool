import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Branch } from '../branches/branch.entity';
import { Saving } from '../savings/savings.entity';
import { Appointment } from '../appointment/appointment.entity';
import { AppointmentPerson } from '../appointment-person/appointment-person.entity';

@Entity('academic_years')
export class AcademicYear {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  branch_id: string;

  @ManyToOne(() => Branch)
  @JoinColumn({ name: 'branch_id' })
  branch: Branch;

  @Column()
  year_name: string;

  @Column({ type: 'date' })
  start_date: string;

  @Column({ type: 'date' })
  end_date: string;

  @Column({ default: true })
  is_active: boolean;

  @Column({ default: false })
  is_deleted: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(() => Saving, (saving) => saving.academic_year)
  savings: Saving[];
 
   @OneToMany(() => Appointment, (a) => a.academicYear)
  appointments: Appointment[];

  @OneToMany(() => AppointmentPerson, (ap) => ap.appointment)
  appointmentPersons: AppointmentPerson[];

}

