import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Homework } from '../homeworks/homework.entity';
import { Saving } from '../savings/savings.entity';
import { Appointment } from '../appointment/appointment.entity';
import { AppointmentPerson } from '../appointment-person/appointment-person.entity';

@Entity('branches')
export class Branch {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: false, unique: true })
  branch_id: string;

  @Column({ nullable: true })
  name: string;

  @Column({ type: 'jsonb', nullable: true })
  address: Record<string, any>;

  @Column({ nullable: true })
  contact: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  profile_pic: string | null;

  @Column({ default: true })
  is_active: boolean;

  @Column({ default: false })
  is_deleted: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(() => Homework, (homework) => homework.branch)
  homeworks: Homework[];

  @OneToMany(() => Saving, (saving) => saving.branch)
  savings: Saving[];

  @OneToMany(() => Appointment, (a) => a.branch)
  appointments: Appointment[];
  @OneToMany(() => AppointmentPerson, (ap) => ap.branch)
  appointmentPersons: AppointmentPerson[];
}
