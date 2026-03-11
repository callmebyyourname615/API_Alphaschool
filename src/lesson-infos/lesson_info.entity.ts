import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Lesson } from '../lessons/lesson.entity';
import { Homework } from '../homeworks/homework.entity';

@Entity('lesson_infos')
export class LessonInfo {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Lesson, (lesson) => lesson.infos, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'lessonId' })
  lesson: Lesson;

  @Column({ type: 'int' })
  lessonInfoNo: number;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  info: string | null;

  @Column({ default: false })
  isEvaluation: boolean;

  @Column({ type: 'int', nullable: true })
  evaluationMaxScore: number | null;

  @Column({ type: 'text', nullable: true })
  evaluationSample: string | null;

  @Column({ type: 'varchar', length: 512, nullable: true })
  infoImage: string | null;

  @Column({ type: 'varchar', length: 512, nullable: true })
  attachment: string | null;
  @Column({ type: 'simple-array', nullable: true })
  evaluationItems: string[] | null; // ← added (simple-array works well for string[])

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Homework, (homework) => homework.lessonInfo)
  homeworks: Homework[];
}
