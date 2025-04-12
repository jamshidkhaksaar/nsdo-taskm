import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, ManyToMany, JoinTable, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Department } from '../../departments/entities/department.entity';

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
  USER = 'user',
  DEPARTMENT = 'department',
  USER_TO_USER = 'user_to_user',
  PROVINCE = 'province'
}

@Entity()
export class Task {
  @PrimaryGeneratedColumn()
  id: number;

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
    default: TaskType.USER
  })
  type: TaskType;

  @Column({ type: 'boolean', default: false })
  is_private: boolean;

  @Column({ type: 'datetime', nullable: true })
  dueDate: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  createdById: string;

  @ManyToOne(() => User, user => user.createdTasks, { eager: false })
  @JoinColumn({ name: 'createdById' })
  createdBy: User;

  // For user-to-user and delegation
  @ManyToMany(() => User, user => user.assignedTasks)
  @JoinTable({
    name: 'task_assignees',
    joinColumn: { name: 'task_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'user_id', referencedColumnName: 'id' },
  })
  assignedToUsers: User[];

  // For department/unit assignment (multiple departments)
  @Column("simple-array", { nullable: true })
  assignedToDepartmentIds: string[];

  // For province assignment
  @Column({ nullable: true })
  assignedToProvinceId: string;

  // For department relation (legacy, for backward compatibility)
  @Column({ nullable: true })
  departmentId: string;

  @ManyToOne(() => Department, department => department.tasks)
  @JoinColumn({ name: 'departmentId' })
  department: Department;

  // Delegation
  @Column({ nullable: true })
  delegatedByUserId: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'delegatedByUserId' })
  delegatedBy: User;
}


