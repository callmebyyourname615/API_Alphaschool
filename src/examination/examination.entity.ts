import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { Student } from '../students/student.entity';
import { Subject } from '../subjects/subject.entity';
import { Admin } from '../admins/admin.entity';
import { Branch } from '../branches/branch.entity';

@Entity('examinations')
export class Examination {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // -----------------------------
  // Branch relation
  // -----------------------------
  @ManyToOne(() => Branch, { nullable: true })
  @JoinColumn({ name: 'branch_id' })
  branch: Branch;

  // -----------------------------
  // Academic year
  // -----------------------------
  @Column({ type: 'varchar', nullable: true })
  academic_year: string | null;

  // -----------------------------
  // Student relation
  // -----------------------------
  @ManyToOne(() => Student, { nullable: true })
  @JoinColumn({ name: 'student_id' })
  student: Student;

  // -----------------------------
  // Subject relation
  // -----------------------------
  @ManyToOne(() => Subject, { nullable: true })
  @JoinColumn({ name: 'subject_id' })
  subject: Subject;

  // -----------------------------
  // Admin relation (optional)
  // -----------------------------
  @ManyToOne(() => Admin, { nullable: true })
  @JoinColumn({ name: 'admin_id' })
  admin: Admin | null;

  // -----------------------------
  // Score (optional)
  // -----------------------------
  @Column({ type: 'int', nullable: true })
  score: number | null;

  // -----------------------------
  // Label (optional)
  // -----------------------------
  @Column({ type: 'varchar', nullable: true })
  label: string | null;

  // -----------------------------
  // Timestamps
  // -----------------------------
  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}