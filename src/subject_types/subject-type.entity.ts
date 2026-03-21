import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('subject_type')
export class SubjectType {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 150, nullable:true })
  name: string;

  @CreateDateColumn()
  created_at: Date;
}