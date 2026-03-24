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
import { SubjectType } from '../subject_types/subject-type.entity';
import { Curriculum } from '../curriculums/curriculum.entity';
import { Branch } from '../branches/branch.entity';
import { SubjectEvaluation } from '../subject_evaluations/subject-evaluation.entity';

@Entity('subjects')
export class Subject {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Subject Type FK
  @Column({ type: 'uuid', nullable: true })
  subject_type_id: string;

  @ManyToOne(() => SubjectType)
  @JoinColumn({ name: 'subject_type_id' })
  subjectType: SubjectType;

  // Curriculum FK
  @Column({ type: 'uuid', nullable: true })
  curriculum_id: string;

  @ManyToOne(() => Curriculum)
  @JoinColumn({ name: 'curriculum_id' })
  curriculum: Curriculum;

  // Class FK
  @Column({ type: 'uuid', nullable: true })
  class_id: string;

  @ManyToOne(() => Class)
  @JoinColumn({ name: 'class_id' })
  class: Class;

  @Column({ type: 'text', nullable: true })
  file_s: string | null;

  @Column({ type: 'text', nullable: true })
  file_t: string | null;

  @Column({ type: 'text', nullable: true })
  file_e: string | null;

  // Dates
  @CreateDateColumn({ name: 'create_dt' })
  create_dt: Date;

  @UpdateDateColumn({ name: 'update_dt' })
  update_dt: Date;

  @ManyToMany(() => Branch, (branch) => branch.subjects)
  branches: Branch[];

  @OneToMany(() => SubjectEvaluation, (evaluation) => evaluation.subject)
  evaluations: SubjectEvaluation[];
}
