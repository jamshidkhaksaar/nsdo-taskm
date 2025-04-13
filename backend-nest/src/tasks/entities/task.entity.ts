import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, ManyToMany, JoinTable, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Department } from '../../departments/entities/department.entity';
import { Province } from '../../provinces/entities/province.entity';

export enum TaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high'
}

export enum TaskType {
  PERSONAL = 'personal',
  DEPARTMENT = 'department',
  USER = 'user',
  PROVINCE_DEPARTMENT = 'province_department'
}

@Entity()
export class Task {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column()
  description: string;

  @Column({
    type: 'enum',
    enum: TaskStatus,
    default: TaskStatus.PENDING
  })
  status: TaskStatus;

  @Column({
    type: 'enum',
    enum: TaskPriority,
    default: TaskPriority.MEDIUM
  })
  priority: TaskPriority;

  @Column({
    type: 'enum',
    enum: TaskType,
  })
  type: TaskType;

  @Column({ type: 'boolean', default: false })
  is_private: boolean;

  @Column({ type: 'datetime', nullable: true })
  dueDate: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'uuid', nullable: false })
  createdById: string;

  @ManyToOne(() => User, user => user.createdTasks, { eager: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'createdById' })
  createdBy: User;

  @ManyToMany(() => User, user => user.assignedTasks)
  @JoinTable({
    name: 'task_user_assignees',
    joinColumn: { name: 'task_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'user_id', referencedColumnName: 'id' },
  })
  assignedToUsers: User[];

  @ManyToMany(() => Department, department => department.assignedTasks)
  @JoinTable({
    name: 'task_department_assignees',
    joinColumn: { name: 'task_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'department_id', referencedColumnName: 'id' },
  })
  assignedToDepartments: Department[];

  @Column({ type: 'uuid', nullable: true })
  assignedToProvinceId: string | null;

  @ManyToOne(() => Province, province => province.assignedTasks, { nullable: true, eager: false })
  @JoinColumn({ name: 'assignedToProvinceId' })
  assignedToProvince: Province | null;

  @Column({ type: 'boolean', default: false })
  isDelegated: boolean;

  @Column({ type: 'uuid', nullable: true })
  delegatedByUserId: string | null;

  @ManyToOne(() => User, { nullable: true, eager: false })
  @JoinColumn({ name: 'delegatedByUserId' })
  delegatedBy: User | null;

  @Column({ type: 'uuid', nullable: true })
  delegatedFromTaskId: string | null;

  @ManyToOne(() => Task, { nullable: true, eager: false, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'delegatedFromTaskId' })
  delegatedFromTask: Task | null;
}


