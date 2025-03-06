import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('api_settings')
export class ApiSettings {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ default: true })
  api_enabled: boolean;

  @Column({ nullable: true })
  api_key: string;

  @Column({ default: false })
  weather_api_enabled: boolean;

  @Column({ nullable: true })
  weather_api_key: string;
  
  @Column({ default: 100 })
  api_rate_limit: number;

  @Column({ nullable: true })
  api_allowed_ips: string;
  
  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
} 