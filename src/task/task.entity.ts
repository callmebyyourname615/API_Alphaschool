// task.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { File } from '../file/files.entity';
import { Student } from '../students/student.entity';
import { Homework } from '../homeworks/homework.entity';

@Entity('tasks')
export class Task {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  name: string;

  @Column({ type: 'timestamptz' })
  deadline: Date;

  @Column({ length: 255, nullable: true })
  description?: string;

  @Column({ length: 50, default: 'In-Process' })
  status: string;

  // polymorphic user
  @Column({ type: 'uuid', nullable: true })
  added_by_id?: string;

  @Column({ length: 50, nullable: true })
  added_by_type?: string; // admin | teacher | staff | parent | superadmin

  @ManyToOne(() => Student, (student) => student.tasks, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'student_id' })
  student?: Student;

  @OneToMany(() => File, (file) => file.task)
  files: File[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => Homework, homework => homework.tasks, { nullable: true })
  homework?: Homework;
}
