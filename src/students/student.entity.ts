import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  ManyToMany,
  JoinTable,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Province } from '../location/province.entity';
import { District } from '../location/district.entity';
import { Parent } from '../parents/parent.entity';
import { Task } from '../task/task.entity';
import { ParticipationScore } from '../participantion_score/participation-score.entity';
import { Class } from '../classes/class.entity';
import { Attendance } from '../attendance/attendance.entity';
import { Branch } from '../branches/branch.entity';
import { AcademicYear } from '../academic_years/academic-year.entity';
import { Saving } from '../savings/savings.entity';

@Entity('students')
export class Student {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Branch, { nullable: true })
  branch: Branch;

  @ManyToOne(() => AcademicYear, { nullable: true })
  academicYear: AcademicYear;

  @Column({ type: 'varchar', length: 100 })
  student_id: string;

  @ManyToOne(() => Class, { nullable: true })
  @JoinColumn({ name: 'class_id' }) // ← add this line
  classId: Class;

  @ManyToOne(() => Province, { nullable: true })
  province: Province;

  @ManyToOne(() => District, { nullable: true })
  district: District;

  @Column({ type: 'varchar', length: 50 })
  village_id: string;

  @Column({ type: 'varchar', length: 255 })
  profile_image_path: string;

  @Column({ type: 'varchar', length: 255 })
  first_name: string;

  @Column({ type: 'varchar', length: 255 })
  last_name: string;

  @Column({ type: 'date' })
  dob: Date;

  @Column({ type: 'varchar', length: 50 })
  gender: string;

  @Column({ type: 'varchar', length: 100 })
  nationality: string;

  @Column({ type: 'varchar', length: 100 })
  ethnicity: string;

  @Column({ type: 'varchar', length: 100 })
  religion: string;

  @Column({ type: 'varchar', length: 255 })
  live_with: string;

  @Column({ type: 'text' })
  address: string;

  @Column({ type: 'jsonb' })
  emergency_contacts: any;

  @Column({ type: 'numeric', precision: 18, scale: 2, default: 0 })
  saving_wallet: number;

  @Column({ default: true })
  is_active: boolean;

  @Column({ default: false })
  is_deleted: boolean;

  @ManyToMany(() => Parent, { cascade: true })
  @JoinTable({
    name: 'student_parents',
    joinColumn: { name: 'student_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'parent_id', referencedColumnName: 'id' },
  })
  parents: Parent[];

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;

  @OneToMany(() => Saving, (saving) => saving.branch)
  savings: Saving[];
  @OneToMany(() => ParticipationScore, (ps) => ps.branchId)
  participationScores: ParticipationScore[];

  @OneToMany(() => Task, (task) => task.student)
  tasks: Task[];

  @OneToMany(() => Attendance, (attendance) => attendance.student)
  attendances: Attendance[];
}
