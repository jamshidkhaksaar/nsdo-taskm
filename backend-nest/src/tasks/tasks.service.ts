import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Task, TaskStatus } from './entities/task.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { User } from '../users/entities/user.entity';
import { UpdateTaskDto } from './dto/update-task.dto';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private tasksRepository: Repository<Task>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async getTasks(user: User, filters?: any): Promise<Task[]> {
    const query = this.tasksRepository.createQueryBuilder('task')
      .leftJoinAndSelect('task.createdBy', 'createdBy')
      .leftJoinAndSelect('task.department', 'department')
      .leftJoinAndSelect('task.assignedTo', 'assignedTo');

    // Filter by task type if specified
    if (filters?.task_type) {
      switch (filters.task_type) {
        case 'my_tasks':
          // Tasks created by the user
          query.where('task.createdById = :userId', { userId: user.id });
          break;
        case 'assigned':
          // Tasks assigned to the user
          query.innerJoin('task.assignedTo', 'assignedUser', 'assignedUser.id = :userId', { userId: user.id });
          break;
        case 'created':
          // Tasks created by the user
          query.where('task.createdById = :userId', { userId: user.id });
          break;
        case 'all':
        default:
          // All tasks the user has access to (created by them or assigned to them)
          query.where('task.createdById = :userId', { userId: user.id })
            .orWhere(qb => {
              const subQuery = qb.subQuery()
                .select('1')
                .from('task_assigned_users', 'tau')
                .where('tau.task_id = task.id')
                .andWhere('tau.user_id = :userId', { userId: user.id })
                .getQuery();
              return 'EXISTS ' + subQuery;
            });
          break;
      }
    }

    // Filter by department if specified
    if (filters?.department) {
      query.andWhere('task.departmentId = :departmentId', { departmentId: filters.department });
    }

    // Filter by assigned user if specified
    if (filters?.assigned_to) {
      query.innerJoin('task.assignedTo', 'assignedToUser', 'assignedToUser.id = :assignedToId', { assignedToId: filters.assigned_to });
    }

    // Filter by created by user if specified
    if (filters?.created_by) {
      query.andWhere('task.createdById = :createdById', { createdById: filters.created_by });
    }

    // Filter by status if specified
    if (filters?.status) {
      query.andWhere('task.status = :status', { status: filters.status });
    }

    return query.getMany();
  }

  async getTaskById(id: string, user: User): Promise<Task> {
    const task = await this.tasksRepository.findOne({
      where: { id },
      relations: ['createdBy', 'department', 'assignedTo'],
    });

    if (!task) {
      throw new NotFoundException(`Task with ID "${id}" not found`);
    }

    // Check if user has access to this task
    const hasAccess = 
      task.createdById === user.id || 
      task.assignedTo.some(assignedUser => assignedUser.id === user.id) ||
      user.role === 'admin';

    if (!hasAccess) {
      throw new NotFoundException(`Task with ID "${id}" not found`);
    }

    return task;
  }

  async createTask(createTaskDto: CreateTaskDto, user: User): Promise<Task> {
    const { 
      title, 
      description, 
      status, 
      priority, 
      dueDate, 
      isPrivate, 
      departmentId, 
      assignedToIds 
    } = createTaskDto;

    // Create new task
    const task = this.tasksRepository.create({
      title,
      description,
      status: status || TaskStatus.TODO,
      priority,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      isPrivate: isPrivate || false,
      createdById: user.id,
      departmentId,
    });

    // Save the task first to get an ID
    const savedTask = await this.tasksRepository.save(task);

    // If there are assigned users, fetch them and assign them to the task
    if (assignedToIds && assignedToIds.length > 0) {
      const assignedUsers = await this.usersRepository.find({
        where: { id: In(assignedToIds) }
      });
      
      savedTask.assignedTo = assignedUsers;
      await this.tasksRepository.save(savedTask);
    }

    // Fetch the complete task with relations
    return this.getTaskById(savedTask.id, user);
  }

  async updateTask(id: string, updateTaskDto: UpdateTaskDto, user: User): Promise<Task> {
    const task = await this.getTaskById(id, user);
    
    // Update basic fields
    if (updateTaskDto.title) task.title = updateTaskDto.title;
    if (updateTaskDto.description !== undefined) task.description = updateTaskDto.description;
    if (updateTaskDto.status) task.status = updateTaskDto.status;
    if (updateTaskDto.priority) task.priority = updateTaskDto.priority;
    if (updateTaskDto.dueDate) task.dueDate = new Date(updateTaskDto.dueDate);
    if (updateTaskDto.isPrivate !== undefined) task.isPrivate = updateTaskDto.isPrivate;
    if (updateTaskDto.departmentId !== undefined) task.departmentId = updateTaskDto.departmentId;

    // Update assigned users if provided
    if (updateTaskDto.assignedToIds) {
      const assignedUsers = await this.usersRepository.find({
        where: { id: In(updateTaskDto.assignedToIds) }
      });
      task.assignedTo = assignedUsers;
    }

    return this.tasksRepository.save(task);
  }

  async deleteTask(id: string, user: User): Promise<void> {
    const task = await this.getTaskById(id, user);
    
    // Only the creator or an admin can delete a task
    if (task.createdById !== user.id && user.role !== 'admin') {
      throw new NotFoundException(`Task with ID "${id}" not found`);
    }
    
    await this.tasksRepository.remove(task);
  }

  async updateTaskStatus(id: string, status: TaskStatus, user: User): Promise<Task> {
    const task = await this.getTaskById(id, user);
    
    task.status = status;
    return this.tasksRepository.save(task);
  }

  async assignTaskToUser(taskId: string, userId: string, currentUser: User): Promise<Task> {
    const task = await this.getTaskById(taskId, currentUser);
    const userToAssign = await this.usersRepository.findOne({ where: { id: userId } });
    
    if (!userToAssign) {
      throw new NotFoundException(`User with ID "${userId}" not found`);
    }
    
    // Initialize assignedTo array if it doesn't exist
    if (!task.assignedTo) {
      task.assignedTo = [];
    }
    
    // Check if user is already assigned
    const isAlreadyAssigned = task.assignedTo.some(user => user.id === userId);
    
    if (!isAlreadyAssigned) {
      task.assignedTo.push(userToAssign);
      await this.tasksRepository.save(task);
    }
    
    return this.getTaskById(taskId, currentUser);
  }

  async unassignTaskFromUser(taskId: string, userId: string, currentUser: User): Promise<Task> {
    const task = await this.getTaskById(taskId, currentUser);
    
    // Filter out the user to unassign
    if (task.assignedTo) {
      task.assignedTo = task.assignedTo.filter(user => user.id !== userId);
      await this.tasksRepository.save(task);
    }
    
    return this.getTaskById(taskId, currentUser);
  }

  async getUserTaskStatistics(userId: string): Promise<any> {
    // Get all tasks created by or assigned to the user
    const tasks = await this.tasksRepository.createQueryBuilder('task')
      .leftJoinAndSelect('task.assignedTo', 'assignedTo')
      .where('task.createdById = :userId', { userId })
      .orWhere('assignedTo.id = :userId', { userId })
      .getMany();

    // Count tasks by status
    const todoTasks = tasks.filter(task => task.status === TaskStatus.TODO).length;
    const inProgressTasks = tasks.filter(task => task.status === TaskStatus.IN_PROGRESS).length;
    const doneTasks = tasks.filter(task => task.status === TaskStatus.DONE).length;

    // Count tasks created by the user
    const createdTasks = tasks.filter(task => task.createdById === userId).length;

    // Count tasks assigned to the user
    const assignedTasks = tasks.filter(task => 
      task.assignedTo && task.assignedTo.some(user => user.id === userId)
    ).length;

    return {
      total: tasks.length,
      todoTasks,
      inProgressTasks,
      doneTasks,
      createdTasks,
      assignedTasks,
      completionRate: tasks.length > 0 ? (doneTasks / tasks.length) * 100 : 0,
    };
  }
} 