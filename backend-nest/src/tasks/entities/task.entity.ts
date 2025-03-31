import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, ManyToMany, JoinTable, JoinColumn } from 'typeorm';
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

export enum TaskContext {
  PERSONAL = 'personal',
  DEPARTMENT = 'department',
  USER = 'user'
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
    enum: TaskContext,
    default: TaskContext.PERSONAL
  })
  context: TaskContext;

  @Column({ type: 'boolean', default: false })
  is_private: boolean;

  @Column({ type: 'datetime', nullable: true })
  dueDate: Date;

  @Column({ nullable: true })
  createdById: string;

  @ManyToOne(() => User, user => user.createdTasks, { eager: false })
  @JoinColumn({ name: 'createdById' })
  createdBy: User;

  @ManyToMany(() => User, user => user.assignedTasks)
  @JoinTable({
    name: 'task_assignees',
    joinColumn: { name: 'task_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'user_id', referencedColumnName: 'id' },
  })
  assignedTo: User[];

  @Column({ nullable: true })
  departmentId: string;

  @ManyToOne(() => Department, department => department.tasks)
  @JoinColumn({ name: 'departmentId' })
  department: Department;
}


