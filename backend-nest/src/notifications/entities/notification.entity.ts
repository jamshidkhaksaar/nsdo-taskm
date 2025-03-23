import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Task } from '../../tasks/entities/task.entity';

export enum NotificationType {
  TASK_CREATED = 'task_created',
  TASK_ASSIGNED = 'task_assigned',
  TASK_STATUS_CHANGED = 'task_status_changed',
  COLLABORATOR_ADDED = 'collaborator_added',
  TASK_DUE_SOON = 'task_due_soon',
  TASK_OVERDUE = 'task_overdue',
}

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  message: string;

  @Column({
    type: 'enum',
    enum: NotificationType,
    default: NotificationType.TASK_ASSIGNED,
  })
  type: NotificationType;

  @Column({ default: false })
  read: boolean;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column()
  user_id: number;

  @ManyToOne(() => Task, { nullable: true })
  @JoinColumn({ name: 'task_id' })
  task: Task;

  @Column({ nullable: true })
  task_id: number;

  @CreateDateColumn()
  created_at: Date;
} 