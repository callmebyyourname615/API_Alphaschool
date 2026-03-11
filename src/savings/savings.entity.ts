import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Student } from '../students/student.entity';
import { Class } from '../classes/class.entity';
import { Branch } from '../branches/branch.entity';
import { AcademicYear } from '../academic_years/academic-year.entity';

@Entity('savings')
export class Saving {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Branch, (branch) => branch.savings, { nullable: false })
  branch: Branch;

  @ManyToOne(() => AcademicYear, (year) => year.savings, { nullable: false })
  academic_year: AcademicYear;

  @ManyToOne(() => Student, (student) => student.savings, { nullable: false })
  student: Student;

  @ManyToOne(() => Class, (cls) => cls.savings, { nullable: false })
  class: Class;

  @Column()
  type: string;

  @Column()
  transaction_type: string;

  @Column()
  status: string;

  @Column({ type: 'numeric', precision: 18, scale: 2, default: 0 })
  opening_balance: number;

  @Column({ type: 'numeric', precision: 18, scale: 2 })
  amount: number;

  @Column({ type: 'numeric', precision: 18, scale: 2, default: 0 })
  closing_balance: number;

  @Column({ type: 'timestamptz', nullable: true })
  lock_time?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  complete_time?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  cancel_time?: Date;

  @Column({ default: true })
  is_active: boolean;

  @Column({ default: false })
  is_deleted: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
