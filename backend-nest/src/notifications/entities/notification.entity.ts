import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { User } from "../../users/entities/user.entity"; // Import User
// import { Task } from '../../tasks/entities/task.entity'; // Keep Task import commented for now if not needed directly on entity

// Define and export the NotificationType enum
export enum NotificationType {
  TASK_ASSIGNED = "task_assigned",
  TASK_UPDATED = "task_updated",
  TASK_STATUS_CHANGED = "task_status_changed", // Added status change
  TASK_PRIORITY_CHANGED = "task_priority_changed", // Added priority change
  TASK_DELEGATED = "task_delegated", // Added delegation
  TASK_DELEGATION_NOTICE = "task_delegation_notice", // Added delegation notice
  MENTION = "mention",
  SYSTEM = "system",
  // Add more types as needed
}

@Entity("notifications")
export class Notification {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({
    type: "enum",
    enum: NotificationType,
  })
  type: NotificationType; // Use the enum type

  @Column("text")
  message: string;

  @Column({ default: false })
  isRead: boolean;

  @CreateDateColumn()
  createdAt: Date;

  // Relationships

  @Column({ name: "user_id" }) // Explicitly define the column name
  userId: string; // ID of the user this notification is for

  @ManyToOne(() => User, { onDelete: "CASCADE" }) // Define relation to User
  @JoinColumn({ name: "user_id" }) // Specify the foreign key column
  user: User;

  @Column({ name: "related_entity_type", nullable: true })
  relatedEntityType: string; // e.g., 'Task', 'Comment'

  @Column({ name: "related_entity_id", nullable: true })
  relatedEntityId: string; // ID of the related entity

  // Specific relationship to Task is likely NOT needed here if we use type/id
  // Keeping commented out:
  // @ManyToOne(() => Task, { nullable: true, onDelete: 'SET NULL' })
  // @JoinColumn({ name: 'related_entity_id', referencedColumnName: 'id' })
  // task: Task;
}
