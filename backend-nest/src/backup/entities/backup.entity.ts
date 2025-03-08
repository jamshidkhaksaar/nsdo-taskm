import { Entity, Column, PrimaryColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum BackupStatus {
  COMPLETED = 'completed',
  IN_PROGRESS = 'in_progress',
  FAILED = 'failed'
}

export enum BackupType {
  FULL = 'full',
  PARTIAL = 'partial'
}

@Entity('backups')
export class Backup {
  @PrimaryColumn()
  id: string;

  @Column()
  name: string;

  @CreateDateColumn()
  timestamp: Date;

  @Column()
  size: string;

  @Column({
    type: 'enum',
    enum: BackupType,
    default: BackupType.FULL
  })
  type: BackupType;

  @Column({
    type: 'enum',
    enum: BackupStatus,
    default: BackupStatus.IN_PROGRESS
  })
  status: BackupStatus;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'created_by_id' })
  createdBy: User;

  @Column({ nullable: true })
  notes: string;

  @Column({ nullable: true })
  error_message: string;

  @Column({ nullable: true })
  file_path: string;

  @Column({ default: false })
  is_deleted: boolean;
} 