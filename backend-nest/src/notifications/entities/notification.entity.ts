import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
// import { User } from '../../users/entities/user.entity'; // Import later when UsersModule is ready
// import { Task } from '../../tasks/entities/task.entity'; // Import later when TasksModule is ready

// Define specific notification types if needed
// export enum NotificationType {
//   TASK_ASSIGNED = 'task_assigned',
//   TASK_UPDATED = 'task_updated',
//   MENTION = 'mention',
//   SYSTEM = 'system',
//   // Add more types as needed
// }

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  type: string; // Consider using Enum later: type: NotificationType;

  @Column('text')
  message: string;

  @Column({ default: false })
  isRead: boolean;

  @CreateDateColumn()
  createdAt: Date;

  // Relationships (Uncomment and adjust when related entities/modules are ready)
  
  // @Column({ name: 'user_id' })
  // userId: string; // ID of the user this notification is for
  
  // @ManyToOne(() => User, { onDelete: 'CASCADE' })
  // @JoinColumn({ name: 'user_id' })
  // user: User;

  // @Column({ name: 'related_entity_type', nullable: true })
  // relatedEntityType: string; // e.g., 'Task', 'Comment'

  // @Column({ name: 'related_entity_id', nullable: true })
  // relatedEntityId: string; // ID of the related entity

  // Example specific relationship (Uncomment if Task entity is ready)
  // @ManyToOne(() => Task, { nullable: true, onDelete: 'SET NULL' })
  // @JoinColumn({ name: 'related_entity_id', referencedColumnName: 'id' }) // Adjust if relatedEntityId stores Task ID
  // task: Task;
} 