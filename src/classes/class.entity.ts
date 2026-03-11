import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Branch } from '../branches/branch.entity';
import { YearLevel } from '../year_levels/year-level.entity';
import { Saving } from '../savings/savings.entity';
import { ParticipationList } from '../participantion_list/participation_list.entity';

@Entity('classes')
export class Class {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  branch_id: string;

  @ManyToOne(() => Branch)
  @JoinColumn({ name: 'branch_id' })
  branch: Branch;

  @Column({ type: 'uuid' })
  year_level_id: string;

  @ManyToOne(() => YearLevel)
  @JoinColumn({ name: 'year_level_id' })
  yearLevel: YearLevel;

  @Column()
  name: string;

  @Column({ type: 'numeric', default: 0 })
  saving_wallet: number;

  @Column({ default: true })
  is_active: boolean;

  @Column({ default: false })
  is_deleted: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
  @OneToMany(() => Saving, (saving) => saving.class)
  savings: Saving[];

  @OneToMany(() => ParticipationList, (list) => list.classes)
  participationLists: ParticipationList[];
}
