import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity'; // Import User
// import { Task } from '../../tasks/entities/task.entity'; // Keep Task import commented for now if not needed directly on entity
// import { NotificationType } from './notification-type.enum'; // Uncomment if NotificationType enum is needed

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

  // Relationships
  
  @Column({ name: 'user_id' }) // Explicitly define the column name
  userId: string; // ID of the user this notification is for
  
  @ManyToOne(() => User, { onDelete: 'CASCADE' }) // Define relation to User
  @JoinColumn({ name: 'user_id' }) // Specify the foreign key column
  user: User;

  @Column({ name: 'related_entity_type', nullable: true })
  relatedEntityType: string; // e.g., 'Task', 'Comment'

  @Column({ name: 'related_entity_id', nullable: true })
  relatedEntityId: string; // ID of the related entity

  // Specific relationship to Task is likely NOT needed here if we use type/id
  // Keeping commented out:
  // @ManyToOne(() => Task, { nullable: true, onDelete: 'SET NULL' })
  // @JoinColumn({ name: 'related_entity_id', referencedColumnName: 'id' }) 
  // task: Task;
} 