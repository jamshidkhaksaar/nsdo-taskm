import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task, TaskStatus, TaskContext } from './entities/task.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { UserRole } from '../users/entities/user.entity';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private tasksRepository: Repository<Task>,
  ) {}

  async create(createTaskDto: CreateTaskDto, user: any): Promise<Task> {
    // Create a new task entity with the correct properties
    const task = new Task();
    task.title = createTaskDto.title;
    task.description = createTaskDto.description;
    task.createdById = user.userId;
    
    // Set context based on DTO or default to PERSONAL
    if (createTaskDto.context) {
      task.context = createTaskDto.context;
    } else {
      task.context = TaskContext.PERSONAL;
    }
    
    // Handle role-based permissions for task creation contexts
    if (user.role !== UserRole.GENERAL_MANAGER && user.role !== UserRole.ADMIN) {
      // Normal users have context-specific permissions
      // For now, we trust the frontend to enforce this, but could add additional validation here
    }
    
    if (createTaskDto.status) {
      task.status = createTaskDto.status;
    }
    
    // Set department only for appropriate contexts
    if (createTaskDto.departmentId && 
        (task.context === TaskContext.DEPARTMENT || user.role === UserRole.GENERAL_MANAGER || user.role === UserRole.ADMIN)) {
      task.departmentId = createTaskDto.departmentId;
    }
    
    if (createTaskDto.dueDate) {
      task.dueDate = new Date(createTaskDto.dueDate);
    }
    
    // Save the task first to get an ID
    const savedTask = await this.tasksRepository.save(task);
    
    // Handle assignedTo separately if provided
    if (createTaskDto.assignedTo && createTaskDto.assignedTo.length > 0) {
      // For personal tasks, these are collaborators
      // For user tasks, these are assignees
      savedTask.assignedTo = [];
    }
    
    return savedTask;
  }

  async findAll(query: any, user: any): Promise<Task[]> {
    try {
      // Use a query builder approach
      let queryBuilder = this.tasksRepository.createQueryBuilder('task');
      
      // Apply filters if provided
      if (query.departmentId) {
        queryBuilder = queryBuilder.andWhere('task.departmentId = :departmentId', { departmentId: query.departmentId });
      }
      
      if (query.status) {
        queryBuilder = queryBuilder.andWhere('task.status = :status', { status: query.status });
      }

      if (query.context) {
        queryBuilder = queryBuilder.andWhere('task.context = :context', { context: query.context });
      }
      
      // Check if we should include all tasks (for TasksOverview)
      const includeAll = query.include_all === 'true' || query.include_all === true;
      
      // Filter by user role
      if (user.role === UserRole.GENERAL_MANAGER) {
        // General managers can see all tasks across all departments and users
        // No additional filters needed
        
        // But if they specifically request tasks for a context, apply that filter
        if (query.task_type === 'my_tasks' && !includeAll) {
          queryBuilder = queryBuilder.andWhere('task.createdById = :userId', { userId: user.userId });
        } else if (query.task_type === 'assigned' && !includeAll) {
          queryBuilder = queryBuilder.andWhere('task.id IN (SELECT task_id FROM task_assignees WHERE user_id = :userId)', { userId: user.userId });
        }
      } else if (user.role === UserRole.ADMIN) {
        // Admins can see everything but typically use admin panel
        // No additional filters needed
      } else {
        // Normal users:
        // - Can see their personal tasks (created_by = user.id)
        // - Can see tasks assigned to them (via task_assignees)
        // - Can see tasks in departments they're assigned to IF they're supposed to see those
        
        if (query.task_type === 'my_tasks') {
          // Only show tasks they created personally
          queryBuilder = queryBuilder.andWhere('task.createdById = :userId', { userId: user.userId });
        } else if (query.task_type === 'assigned') {
          // Only show tasks assigned to them
          queryBuilder = queryBuilder.andWhere('task.id IN (SELECT task_id FROM task_assignees WHERE user_id = :userId)', { userId: user.userId });
        } else {
          // Default behavior: Show tasks they created OR are assigned to
          queryBuilder = queryBuilder.andWhere(
            '(task.createdById = :userId OR task.id IN (SELECT task_id FROM task_assignees WHERE user_id = :userId))',
            { userId: user.userId }
          );
        }
      }
      
      // Execute the query
      const tasks = await queryBuilder.getMany();
      return tasks;
    } catch (error) {
      console.error('Error finding tasks:', error);
      return [];
    }
  }

  async findOne(id: number): Promise<Task> {
    try {
      const task = await this.tasksRepository.findOne({
        where: { id },
      });
      
      if (!task) {
        throw new NotFoundException(`Task with ID ${id} not found`);
      }
      
      return task;
    } catch (error) {
      console.error(`Error finding task with ID ${id}:`, error);
      throw new NotFoundException(`Task with ID ${id} not found`);
    }
  }

  async update(id: number, updateTaskDto: UpdateTaskDto): Promise<Task> {
    const task = await this.findOne(id);
    
    // Update simple properties
    if (updateTaskDto.title) task.title = updateTaskDto.title;
    if (updateTaskDto.description) task.description = updateTaskDto.description;
    if (updateTaskDto.status) task.status = updateTaskDto.status;
    if (updateTaskDto.departmentId) task.departmentId = updateTaskDto.departmentId;
    if (updateTaskDto.dueDate) task.dueDate = new Date(updateTaskDto.dueDate);
    
    return this.tasksRepository.save(task);
  }

  async remove(id: number): Promise<void> {
    const result = await this.tasksRepository.delete(id);
    
    if (result.affected === 0) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }
  }

  async updateStatus(id: number, status: string): Promise<Task> {
    const task = await this.findOne(id);
    
    // Validate status
    if (!Object.values(TaskStatus).includes(status as TaskStatus)) {
      throw new Error(`Invalid status: ${status}`);
    }
    
    task.status = status as TaskStatus;
    
    return this.tasksRepository.save(task);
  }

  async assignTask(id: number, userId: string): Promise<Task> {
    // For now, we'll just return the task without actually assigning
    // In a real app, you'd want to properly handle the many-to-many relationship
    const task = await this.findOne(id);
    return task;
  }
} 