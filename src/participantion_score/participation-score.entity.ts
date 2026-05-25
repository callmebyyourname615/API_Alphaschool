import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

interface ScoreEntry {
  studentId: string;
  studentName?: string;  // ← store name to avoid joins when reading history
  participationId: string;
  participationName: string;
  score: number;
}

@Entity('participation_scores')
export class ParticipationScore {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: true })
  branchId: string;

  @Column({ type: 'uuid', nullable: true })
  academicYearId: string;

  @Column({ type: 'uuid' })
  levelId: string;    // ← to know which participation lists were available

  @Column({ type: 'uuid' })
  classId: string;    // ← to know which class was scored that day

  @Column({ type: 'jsonb' })
  scores: ScoreEntry[];

  @Column({ type: 'uuid' })
  addedBy: string;

  @Column({ type: 'date', nullable: true })
  date: Date | null;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}