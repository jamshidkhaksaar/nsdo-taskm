import { Injectable, Inject, forwardRef, Optional, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationType } from './entities/notification.entity';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { UsersService } from '../users/users.service';
import { TasksService } from '../tasks/tasks.service';
import { Task } from '../tasks/entities/task.entity';
import { User } from '../users/entities/user.entity';
import { DeepPartial } from 'typeorm';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private notificationsRepository: Repository<Notification>,
    private usersService: UsersService,
    @Optional() @Inject(forwardRef(() => TasksService))
    private tasksService: TasksService,
  ) {}

  // Create a notification
  async create(createNotificationDto: CreateNotificationDto): Promise<Notification> {
    const notification = this.notificationsRepository.create(createNotificationDto as DeepPartial<Notification>);
    return this.notificationsRepository.save(notification);
  }

  // Find all notifications for a user
  async findAllForUser(userId: string): Promise<Notification[]> {
    return this.notificationsRepository.find({
      where: { user_id: userId },
      order: { created_at: 'DESC' },
    });
  }

  // Find unread notifications for a user
  async findUnreadForUser(userId: string): Promise<Notification[]> {
    return this.notificationsRepository.find({
      where: { user_id: userId, read: false },
      order: { created_at: 'DESC' },
    });
  }

  // Find a single notification by ID
  async findOne(id: string): Promise<Notification> {
    const notification = await this.notificationsRepository.findOne({ where: { id } });
    
    if (!notification) {
      throw new NotFoundException(`Notification with ID ${id} not found`);
    }
    
    return notification;
  }

  // Update a notification
  async update(id: string, updateNotificationDto: UpdateNotificationDto): Promise<Notification> {
    await this.notificationsRepository.update(id, updateNotificationDto);
    return this.findOne(id);
  }

  // Mark a notification as read
  async markAsRead(id: string): Promise<Notification> {
    await this.notificationsRepository.update(id, { read: true });
    return this.findOne(id);
  }

  // Mark all notifications as read for a user
  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationsRepository.update({ user_id: userId, read: false }, { read: true });
  }

  // Remove a notification
  async remove(id: string): Promise<void> {
    const result = await this.notificationsRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Notification with ID ${id} not found`);
    }
  }

  // Helper methods for creating specific types of notifications
  
  // Notify user when a task is assigned to them
  async notifyTaskAssigned(task: Task, assignedUser: User, assignedBy: User): Promise<void> {
    if (!assignedUser || assignedUser.id === assignedBy.id || !this.tasksService) return;

    const message = `${assignedBy.username} assigned you a task: ${task.title}`;
    
    await this.create({
      message,
      type: NotificationType.TASK_ASSIGNED,
      user_id: assignedUser.id,
      task_id: task.id,
      read: false,
    });
  }

  // Notify user when they're added as a collaborator
  async notifyCollaboratorAdded(task: Task, collaborator: User, addedBy: User): Promise<void> {
    if (!collaborator || collaborator.id === addedBy.id || !this.tasksService) return;

    const message = `${addedBy.username} added you as a collaborator on: ${task.title}`;
    
    await this.create({
      message,
      type: NotificationType.COLLABORATOR_ADDED,
      user_id: collaborator.id,
      task_id: task.id,
      read: false,
    });
  }

  // Notify users when a task status changes
  async notifyTaskStatusChanged(task: Task, previousStatus: string, updatedBy: User): Promise<void> {
    if (!this.tasksService) return;
    
    // Get all relevant users (assigned + collaborators)
    const interestedUsers = await this.getTaskInterestedUsers(task);
    
    if (!interestedUsers.length) return;
    
    const statusDisplay = task.status.replace('_', ' ').toLowerCase();
    const message = `Task "${task.title}" status changed to ${statusDisplay} by ${updatedBy.username}`;
    
    // Create notifications for all interested users except the updater
    await Promise.all(
      interestedUsers
        .filter(user => user.id !== updatedBy.id)
        .map(user => 
          this.create({
            message,
            type: NotificationType.TASK_STATUS_CHANGED,
            user_id: user.id,
            task_id: task.id,
            read: false,
          })
        )
    );
  }

  // Get all users interested in a task (assigned + collaborators)
  private async getTaskInterestedUsers(task: Task): Promise<User[]> {
    if (!this.tasksService) {
      return [];
    }
    
    const completeTask = await this.tasksService.findOne(task.id);
    const users: User[] = [];
    
    // Add assigned users if there are any
    if (completeTask.assignedToUsers && completeTask.assignedToUsers.length > 0) {
      for (const assignedUser of completeTask.assignedToUsers) {
        const user = await this.usersService.findById(assignedUser.id);
        if (user && !users.some(u => u.id === user.id)) {
          users.push(user);
        }
      }
    }
    
    // Add task creator
    if (completeTask.createdBy) {
      const creator = await this.usersService.findById(completeTask.createdBy.id);
      if (creator && !users.some(u => u.id === creator.id)) {
        users.push(creator);
      }
    }
    
    return users;
  }
} 