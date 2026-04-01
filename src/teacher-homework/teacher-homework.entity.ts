import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { TeacherHomeworkItem } from './teacher-homework-item.entity';
import { TeacherHomeworkStatus } from './teacher-homework-status.enum';
import { TeachLearning } from '../teach_learning/teach-learning.entity';

@Entity('teacher_homework')
export class TeacherHomework {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid', { name: 'teach_learning_id' })
  teachLearningId: string;

  @ManyToOne(
    () => TeachLearning,
    (teachLearning) => teachLearning.teacherHomeworks,
    {
      nullable: false,
      onDelete: 'RESTRICT',
    },
  )
  @JoinColumn({ name: 'teach_learning_id' })
  teachLearning: TeachLearning;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text', name: 'overall_instruction', nullable: true })
  overallInstruction: string | null;

  @Column({ type: 'timestamp', name: 'due_date', nullable: true })
  dueDate: Date | null;

  @Column({
    type: 'enum',
    enum: TeacherHomeworkStatus,
    default: TeacherHomeworkStatus.DRAFT,
  })
  status: TeacherHomeworkStatus;

  @Column({ type: 'timestamp', name: 'sent_at', nullable: true })
  sentAt: Date | null;

  @Column({ type: 'int', name: 'total_score', default: 0 })
  totalScore: number;

  @OneToMany(() => TeacherHomeworkItem, (item) => item.teacherHomework, {
    cascade: true,
  })
  items: TeacherHomeworkItem[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}