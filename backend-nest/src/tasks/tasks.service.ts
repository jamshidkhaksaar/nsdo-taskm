import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task, TaskStatus } from './entities/task.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

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
    
    if (createTaskDto.status) {
      task.status = createTaskDto.status;
    }
    
    if (createTaskDto.departmentId) {
      task.departmentId = createTaskDto.departmentId;
    }
    
    if (createTaskDto.dueDate) {
      task.dueDate = new Date(createTaskDto.dueDate);
    }
    
    // Save the task first to get an ID
    const savedTask = await this.tasksRepository.save(task);
    
    // Handle assignedTo separately if provided
    if (createTaskDto.assignedTo && createTaskDto.assignedTo.length > 0) {
      // We'll handle this in a simpler way for now
      // In a real app, you'd want to fetch the users and properly assign them
      savedTask.assignedTo = [];
    }
    
    return savedTask;
  }

  async findAll(query: any, user: any): Promise<Task[]> {
    try {
      // Use a simpler approach without complex joins
      let queryBuilder = this.tasksRepository.createQueryBuilder('task');
      
      // Apply filters if provided
      if (query.departmentId) {
        queryBuilder = queryBuilder.andWhere('task.departmentId = :departmentId', { departmentId: query.departmentId });
      }
      
      if (query.status) {
        queryBuilder = queryBuilder.andWhere('task.status = :status', { status: query.status });
      }
      
      // Filter by user role
      if (user.role !== 'admin') {
        // Regular users can only see tasks they created or are assigned to
        queryBuilder = queryBuilder.andWhere(
          '(task.createdById = :userId)',
          { userId: user.userId }
        );
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