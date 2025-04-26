import { Entity, PrimaryColumn, Column, UpdateDateColumn } from 'typeorm';

@Entity('settings')
export class Setting {
  @PrimaryColumn({ type: 'varchar', length: 50 })
  key: string; // e.g., 'SENDGRID_API_KEY', 'EMAIL_FROM_ADDRESS'

  @Column('text')
  value: string;

  @Column({ type: 'text', nullable: true })
  description?: string; // Optional description of the setting

  @UpdateDateColumn()
  updatedAt: Date;
} 