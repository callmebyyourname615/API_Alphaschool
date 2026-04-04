import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Subject } from '../subjects/subject.entity';
import { Evaluation } from '../evaluations/evaluation.entity';

@Entity('subject_evaluations')
export class SubjectEvaluation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Subject, (subject) => subject.evaluations, { nullable: false })
  subject: Subject;

  @Column()
  topic: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'jsonb', default: [] })
  contents: {
    t_title: string;
    t_page: string;
    e_title?: string[];
    e_page?: string[];
  }[];

  @CreateDateColumn()
  create_at: Date;

  @UpdateDateColumn()
  update_at: Date;

  @OneToMany(() => Evaluation, (evaluation) => evaluation.subjectEvaluation)
  evaluations: Evaluation[];
}