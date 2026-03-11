import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Teaching } from '../teachings/teaching.entity';
import { Lesson } from '../lessons/lesson.entity';
import { LessonInfo } from '../lesson-infos/lesson_info.entity';
import { Branch } from '../branches/branch.entity';
import { Task } from '../task/task.entity';

@Entity('homeworks')
export class Homework {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  score: number | null;

  @Column({ type: 'timestamp', nullable: true })
  deadline: Date | null;

  // Explicit foreign key columns (recommended)
  @Column({ type: 'uuid', name: 'teaching_id' })
  teachingId: string;

  @Column({ type: 'uuid', nullable: true, name: 'lesson_id' })
  lessonId: string | null;

  @Column({ type: 'uuid', nullable: true, name: 'lesson_info_id' })
  lessonInfoId: string | null;

  @Column({ type: 'uuid', name: 'branch_id' })
  branchId: string;

  // Relations
  @ManyToOne(() => Teaching, { nullable: false, onDelete: 'RESTRICT' })
  teaching: Teaching;

  @ManyToOne(() => Lesson, { nullable: true, onDelete: 'SET NULL' })
  lesson: Lesson | null;

  // This is the inverse side of the relation from LessonInfo
  @ManyToOne(() => LessonInfo, (lessonInfo) => lessonInfo.homeworks, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  lessonInfo: LessonInfo | null;

  @ManyToOne(() => Branch, { nullable: false, onDelete: 'RESTRICT' })
  branch: Branch;

  @OneToMany(() => Task, (task) => task.homework, {
    cascade: ['insert', 'update', 'remove'],
  })
  tasks: Task[];

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
