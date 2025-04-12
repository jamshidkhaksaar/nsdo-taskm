import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task, TaskStatus, TaskType } from './entities/task.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { UserRole } from '../users/entities/user.entity';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private tasksRepository: Repository<Task>,
  ) {}

  async create(createTaskDto: CreateTaskDto & Record<string, any>, user: any): Promise<Task> {
    console.log('Creating task with DTO:', JSON.stringify(createTaskDto, null, 2));
    
    try {
      // Create a new task entity with the correct properties
      const task = new Task();
      task.title = createTaskDto.title;
      task.description = createTaskDto.description;
      task.createdById = user.userId;
      
      // Set type based on DTO or default to USER
      if (createTaskDto.type) {
        task.type = createTaskDto.type;
      } else {
        task.type = TaskType.USER;
      }
      
      console.log('Task type set to:', task.type);
      
      // Handle role-based permissions for task creation contexts
      if (user.role !== UserRole.GENERAL_MANAGER && user.role !== UserRole.ADMIN) {
        // Normal users have context-specific permissions
        console.log('User role:', user.role);
      }
      
      if (createTaskDto.status) {
        if (Object.values(TaskStatus).includes(createTaskDto.status as TaskStatus)) {
          task.status = createTaskDto.status as TaskStatus;
        } else {
          console.log('Invalid status value:', createTaskDto.status);
          // Default to PENDING if invalid
          task.status = TaskStatus.PENDING;
        }
      } else {
        task.status = TaskStatus.PENDING;
      }
      
      console.log('Task status set to:', task.status);
      
      // Set department - handle both departmentId and department fields from frontend
      const departmentId = createTaskDto.departmentId || 
                           (createTaskDto.department && typeof createTaskDto.department === 'string' ? 
                            createTaskDto.department : null);
                            
      if (departmentId &&
          (task.type === TaskType.DEPARTMENT || user.role === UserRole.GENERAL_MANAGER || user.role === UserRole.ADMIN)) {
        task.departmentId = departmentId;
        console.log('Task department set to:', task.departmentId);
      }
      
      // Map due_date to dueDate if it exists in the incoming data
      if ('due_date' in createTaskDto) {
        task.dueDate = new Date(createTaskDto.due_date as string);
        console.log('Setting due date from due_date:', task.dueDate);
      } else if (createTaskDto.dueDate) {
        task.dueDate = new Date(createTaskDto.dueDate);
        console.log('Setting due date from dueDate:', task.dueDate);
      }
      
      console.log('Task object before save:', JSON.stringify(task, null, 2));
      
      // Save the task first to get an ID
      const savedTask = await this.tasksRepository.save(task);
      console.log('Task saved successfully with ID:', savedTask.id);
      
      // Flexible assignment logic
      if (createTaskDto.assignedToUsers && createTaskDto.assignedToUsers.length > 0) {
        savedTask.assignedToUsers = createTaskDto.assignedToUsers.map(id => ({ id } as any));
      }
      if (createTaskDto.assignedToDepartmentIds && createTaskDto.assignedToDepartmentIds.length > 0) {
        savedTask.assignedToDepartmentIds = createTaskDto.assignedToDepartmentIds;
      }
      if (createTaskDto.assignedToProvinceId) {
        savedTask.assignedToProvinceId = createTaskDto.assignedToProvinceId;
      }
      if (createTaskDto.delegatedByUserId) {
        savedTask.delegatedByUserId = createTaskDto.delegatedByUserId;
      }
      
      return savedTask;
    } catch (error) {
      console.error('Error creating task:', error);
      if (error.code === '23505') {
        throw new BadRequestException('Task with that title already exists');
      } else if (error.message) {
        throw new BadRequestException(`Failed to create task: ${error.message}`);
      } else {
        throw new BadRequestException('Failed to create task');
      }
    }
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
        // Delegate a task to other users
      }

      if (query.context) {
        queryBuilder = queryBuilder.andWhere('task.context = :context', { context: query.context });
      }
      
      // Check if we should include all tasks (for TasksOverview)
      const includeAll = query.include_all === 'true' || query.include_all === true;
      
      // Filter by user role
      if (user.role === UserRole.MANAGER || user.role === UserRole.GENERAL_MANAGER) {
        // Managers and General managers can see all tasks across all departments and users
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
    // Add priority update
    if (updateTaskDto.priority) task.priority = updateTaskDto.priority;
    
    return this.tasksRepository.save(task);
  }

  async remove(id: number): Promise<void> {
    const result = await this.tasksRepository.delete(id);
    
    if (result.affected === 0) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }
  }

  // Delegate a task to other users
  async delegateTask(id: number, userIds: string[], delegator: any): Promise<Task> {
    const task = await this.findOne(id);
    if (!task) throw new NotFoundException('Task not found');
    // Only allow delegation if the user is assigned or is the creator
    if (
      task.createdById !== delegator.userId &&
      !(task.assignedToUsers && task.assignedToUsers.some(u => u.id === delegator.userId))
    ) {
      throw new ForbiddenException('You are not allowed to delegate this task');
    }
    // Set delegatedByUserId
    task.delegatedByUserId = delegator.userId;
    // Assign new users (replace or add to assignedToUsers)
    // For simplicity, replace the list
    task.assignedToUsers = userIds.map(id => ({ id } as any));
    return this.tasksRepository.save(task);
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
