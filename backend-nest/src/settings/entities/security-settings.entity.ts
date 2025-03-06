import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('security_settings')
export class SecuritySettings {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ default: false })
  two_factor_enabled: boolean;

  @Column({ default: 90 })
  password_expiry_days: number;

  @Column({ default: 5 })
  max_login_attempts: number;

  @Column({ default: 30 })
  lockout_duration_minutes: number;

  @Column({ default: true })
  password_complexity_required: boolean;

  @Column({ default: 60 })
  session_timeout_minutes: number;
  
  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
} 