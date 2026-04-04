import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Subject } from '../subjects/subject.entity';
import { Class } from '../classes/class.entity';
import { Student } from '../students/student.entity';
import { Admin } from '../admins/admin.entity';

@Entity('evaluations')
export class Evaluation {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Subject, { eager: true })
  @JoinColumn({ name: 'subject_id' })
  subject: Subject;

  @ManyToOne(() => Admin, { eager: true })
  @JoinColumn({ name: 'admin_id' })
  admin: Admin;

  @ManyToOne(() => Class, { eager: true })
  @JoinColumn({ name: 'class_id' })
  class: Class;

  @ManyToOne(() => Student, { eager: true })
  @JoinColumn({ name: 'student_id' })
  student: Student;

  @Column({ type: 'float', nullable: true })
  score: number;

  @Column({ type: 'timestamp', nullable: true })
  created_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  updated_at: Date;
}
