import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
  Index,
} from 'typeorm';
import { Role } from './role.entity';

@Entity('permissions')
export class Permission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // e.g., 'task:create', 'user:edit', 'page:view:admin_dashboard'
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 100, unique: true })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  // e.g., 'Tasks', 'Users', 'Admin Pages', 'Settings'
  @Column({ type: 'varchar', length: 50, nullable: true })
  group: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // --- Relationships ---

  // Define the inverse side of the ManyToMany relationship from Role
  @ManyToMany(() => Role, (role) => role.permissions)
  roles: Role[];
} 