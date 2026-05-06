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
import { Attendance } from '../attendance/attendance.entity';
import { Branch } from '../branches/branch.entity';
import { Saving } from '../savings/savings.entity';
import { Enrollment } from '../enrollments/enrollment.entity';

@Entity('students')
export class Student {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // =========================
  // FK: Branch
  // =========================
  @Column('uuid', { name: 'branch_id', nullable: true })
  branchId: string | null;

  @ManyToOne(() => Branch, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'branch_id' })
  branch: Branch | null;

  // =========================
  // BASIC FIELDS
  // =========================
  @Column({ type: 'varchar', length: 100 })
  student_id: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  village_id: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  profile_image_path: string;

  @Column({ type: 'varchar', length: 255 })
  first_name: string;

  @Column({ type: 'varchar', length: 255 })
  last_name: string;

  @Column({ type: 'date' })
  dob: Date;

  @Column({ type: 'varchar', length: 50 })
  gender: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  nationality: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  ethnicity: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  religion: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  live_with: string;

  @Column({ type: 'text', nullable: true })
  address: string;

  @Column({ type: 'jsonb', nullable: true })
  emergency_contacts: any;

  @Column({ type: 'numeric', precision: 18, scale: 2, default: 0 })
  saving_wallet: number;

  @Column({ default: true })
  is_active: boolean;

  @Column({ default: false })
  is_deleted: boolean;

  // =========================
  // LOCATION
  // =========================
  @ManyToOne(() => Province, { nullable: true })
  province: Province | null;

  @ManyToOne(() => District, { nullable: true })
  district: District | null;

  // =========================
  // RELATIONS
  // =========================
  @ManyToMany(() => Parent, { cascade: true })
  @JoinTable({
    name: 'student_parents',
    joinColumn: { name: 'student_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'parent_id', referencedColumnName: 'id' },
  })
  parents: Parent[];

  @OneToMany(() => Enrollment, (e) => e.student)
  enrollments: Enrollment[];

  @OneToMany(() => Saving, (saving) => saving.student)
  savings: Saving[];

  @OneToMany(() => Task, (task) => task.student)
  tasks: Task[];

  @OneToMany(() => Attendance, (attendance) => attendance.student)
  attendances: Attendance[];

  // ✅ Removed broken ParticipationScore relation (uses jsonb, no FK to student)

  // =========================
  // TIMESTAMPS
  // =========================
  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;
}