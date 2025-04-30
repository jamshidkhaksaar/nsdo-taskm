import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("notification_settings")
export class NotificationSettings {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ default: true })
  email_notifications_enabled: boolean;

  @Column({ default: "smtp.example.com" })
  smtp_server: string;

  @Column({ default: 587 })
  smtp_port: number;

  @Column({ default: "notifications@example.com" })
  smtp_username: string;

  @Column({ nullable: true })
  smtp_password: string;

  @Column({ default: true })
  smtp_use_tls: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
