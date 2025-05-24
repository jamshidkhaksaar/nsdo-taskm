import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("backup_settings")
export class BackupSettings {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ default: true })
  auto_backup_enabled: boolean;

  @Column({ default: 24 })
  backup_frequency_hours: number;

  @Column({ default: 30 })
  backup_retention_days: number;

  @Column({ default: "/backups" })
  backup_location: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
