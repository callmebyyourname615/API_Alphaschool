import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  ManyToMany,
  OneToMany,
} from 'typeorm';

import { Class } from '../classes/class.entity';
import { Curriculum } from '../curriculums/curriculum.entity';
import { Branch } from '../branches/branch.entity';
import { SubjectEvaluation } from '../subject_evaluations/subject-evaluation.entity';
import { Teaching } from '../teachings/teaching.entity';
import { SubjectType } from '../subject_types/subject-type.entity';

@Entity('subjects')
export class Subject {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Link to real name
  // In Subject entity
  @Column({ type: 'uuid', nullable: true }) // ← Change to true for now
  subject_type_id: string;

  @ManyToOne(() => SubjectType, (subjectType) => subjectType.subjects, {
    nullable: true,
  })
  @JoinColumn({ name: 'subject_type_id' })
  subjectType: SubjectType | null;

  // Other important relations
  @Column({ type: 'uuid', nullable: true })
  curriculum_id: string;

  @ManyToOne(() => Curriculum, { nullable: true })
  @JoinColumn({ name: 'curriculum_id' })
  curriculum: Curriculum | null;

  @Column({ type: 'uuid', nullable: true })
  class_id: string;

  @ManyToOne(() => Class, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'class_id' })
  class: Class;

  // Materials (can be different per class/branch if needed)
  @Column({ type: 'text', nullable: true })
  file_s: string | null;

  @Column({ type: 'text', nullable: true })
  s_year: string | null;

  @Column({ type: 'text', nullable: true })
  file_t: string | null;

  @Column({ type: 'text', nullable: true })
  t_year: string | null;

  @Column({ type: 'text', nullable: true })
  file_e: string | null;

  @Column({ default: true })
  is_active: boolean;

  @Column({ default: false })
  is_deleted: boolean;

  @CreateDateColumn({ name: 'create_dt' })
  create_dt: Date;

  @UpdateDateColumn({ name: 'update_dt' })
  update_dt: Date;

  @ManyToMany(() => Branch, (branch) => branch.subjects)
  branches: Branch[];

  @OneToMany(() => SubjectEvaluation, (evaluation) => evaluation.subject)
  evaluations: SubjectEvaluation[];

  @OneToMany(() => Teaching, (teaching) => teaching.subject)
  teachings: Teaching[];
}
