import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Saving } from '../savings/savings.entity';

export enum PayReceiveStatus {
  PENDING = 'pending',
  RECEIVED = 'received',
  REJECTED = 'rejected',
}

@Entity('pay_receive')
export class PayReceive {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // ── Saving relation (includes createdBy admin, student/class detail) ───────
  @ManyToOne(() => Saving, { nullable: false, eager: true })
  @JoinColumn({ name: 'saving_id' })
  saving: Saving;

  @Column({ type: 'uuid', name: 'saving_id' })
  saving_id: string;

  // ── Amount being transferred ───────────────────────────────────────────────
  @Column({ type: 'numeric', precision: 18, scale: 2 })
  amount: number;

  // ── Status ────────────────────────────────────────────────────────────────
  @Column({
    type: 'enum',
    enum: PayReceiveStatus,
    default: PayReceiveStatus.PENDING,
  })
  status: PayReceiveStatus;

  @Column({ type: 'varchar', length: 255, nullable: true })
  note?: string | null;

  // ── Who received (admin uuid, no relation — query Admin separately if needed)
  @Column({ type: 'uuid', name: 'received_by', nullable: true })
  received_by?: string | null;

  @Column({ type: 'timestamptz', name: 'received_at', nullable: true })
  received_at?: Date | null;

  // ── Soft delete ───────────────────────────────────────────────────────────
  @Column({ default: false })
  is_deleted: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}