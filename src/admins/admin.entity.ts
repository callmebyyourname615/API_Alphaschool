import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
  JoinTable,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Role } from '../roles/role.entity';
import { Branch } from '../branches/branch.entity';
import { Teaching } from '../teachings/teaching.entity';

@Entity('admins')
export class Admin {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, unique: true, nullable: true })
  username: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  password: string | null;

  @Column({ type: 'varchar', length: 255, unique: true, nullable: true })
  email: string | null;

  @ManyToMany(() => Role, (role) => role.admins)
  @JoinTable({
    name: 'admin_roles',
    joinColumn: { name: 'admin_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'role_id', referencedColumnName: 'id' },
  })
  roles: Role[];

  @ManyToOne(() => Branch, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'branch_id' })
  branch: Branch | null;

  @Column({
    type: 'date',
    nullable: true,
    transformer: {
      from: (value: string | null) => (value ? new Date(value) : null),
      to: (value: Date | null) =>
        value ? value.toISOString().split('T')[0] : null,
    },
  })
  join_date: Date | null;

  @Column({ type: 'varchar', length: 100, nullable: true }) // ← added type + length
  first_name: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  last_name: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true }) // length for phone
  phone: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true }) // length for phone
  tell: string | null;

  @Column({
    type: 'date',
    nullable: true,
    transformer: {
      from: (value: string | null) => (value ? new Date(value) : null),
      to: (value: Date | null) =>
        value ? value.toISOString().split('T')[0] : null,
    },
  })
  dob: Date | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  gender: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  village: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  district: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  province: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  current_academic_year: string | null;

  @Column({ default: true })
  is_active: boolean;

  @Column({ default: false })
  is_deleted: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true })
  profile_pic: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;

  @OneToMany(() => Teaching, (teaching) => teaching.teacher)
  teachings: Teaching[];
}
