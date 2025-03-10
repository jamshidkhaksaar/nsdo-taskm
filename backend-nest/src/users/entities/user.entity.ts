import { Column, Entity, JoinTable, ManyToMany, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Exclude } from 'class-transformer';
import { Task } from '../../tasks/entities/task.entity';
import { Department } from '../../departments/entities/department.entity';
import { Note } from '../../notes/entities/note.entity';

export enum UserRole {
  USER = 'user',
  MANAGER = 'manager',
  GENERAL_MANAGER = 'general_manager',
  ADMIN = 'admin',
}

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  username: string;

  @Column({ unique: true })
  email: string;

  @Column()
  @Exclude({ toPlainOnly: true })
  password: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER,
  })
  role: UserRole;

  @Column({ default: true })
  isActive: boolean;

  // 2FA fields
  @Column({ default: false })
  twoFactorEnabled: boolean;

  @Column({ nullable: true })
  @Exclude({ toPlainOnly: true })
  twoFactorSecret: string;

  @Column({ default: 'app' })
  twoFactorMethod: string; // 'app' for authenticator app, 'email' for email-based 2FA

  @Column({ type: 'json', nullable: true })
  rememberedBrowsers: { fingerprint: string, expiresAt: Date }[];

  // Profile fields
  @Column({ nullable: true, type: 'text' })
  bio: string;

  @Column({ nullable: true })
  avatarUrl: string;

  @Column({ type: 'simple-array', nullable: true })
  skills: string[];

  @Column({ type: 'json', nullable: true })
  socialLinks: Record<string, string>;

  @Column({ type: 'json', nullable: true })
  preferences: Record<string, any>;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt: Date;

  // Tasks created by this user
  @OneToMany(() => Task, (task) => task.createdBy)
  createdTasks: Task[];

  // Tasks assigned to this user
  @ManyToMany(() => Task, (task) => task.assignedTo)
  assignedTasks: Task[];

  // Departments this user belongs to
  @ManyToMany(() => Department, (department) => department.members)
  @JoinTable({
    name: 'user_departments',
    joinColumn: { name: 'user_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'department_id', referencedColumnName: 'id' },
  })
  departments: Department[];

  // Notes created by this user
  @OneToMany(() => Note, (note) => note.user)
  notes: Note[];
} 