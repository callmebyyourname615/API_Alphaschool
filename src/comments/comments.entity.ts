import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum AuditorType {
  ADMIN = 'ADMIN',
  PARENT = 'PARENT',
}

export enum ModuleType {
  TASK = 'TASK',
  EVENT = 'EVENT',
  EVENT_ACTIVITY = 'EVENT_ACTIVITY',
  ANNOUNCEMENT = 'ANNOUNCEMENT',
}

@Entity('comments')
export class Comment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text', nullable: true })
  comment: string | null;

  @Column({ type: 'uuid', nullable: true })
  auditor_id: string; // admin_id หรือ parent_id

  @Column({ type: 'enum', enum: AuditorType, nullable: true })
  auditor_type: AuditorType | null;

  @Column({ type: 'uuid', nullable: true })
  module_id: string;

  @Column({ type: 'enum', enum: ModuleType, nullable: true })
  module_type: ModuleType;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
