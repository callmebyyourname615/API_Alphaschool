// src/lessons/entities/lesson.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { Teaching } from '../teachings/teaching.entity';
import { LessonInfo } from '../lesson-infos/lesson_info.entity';
import { Homework } from '../homeworks/homework.entity';

@Entity('lessons')
export class Lesson {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'teaching_id' })
  teachingId!: string; // ← add this

  @ManyToOne(() => Teaching, (teaching) => teaching.lessons, {
    nullable: false,
    onDelete: 'CASCADE', // or 'RESTRICT'
  })
  @JoinColumn({ name: 'teaching_id' })
  teaching: Teaching;

  @Column({ length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'date' })
  lessonDate: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @OneToMany(() => LessonInfo, (info) => info.lesson, { cascade: true })
  infos: LessonInfo[];

  @OneToMany(() => Homework, (homework) => homework.lesson)
    homeworks: Homework[];
}
