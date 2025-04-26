import { Injectable, NotFoundException, ForbiddenException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository, SelectQueryBuilder, Not } from 'typeorm';
import { Task, TaskStatus, TaskPriority, TaskType } from './entities/task.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { User, UserRole } from '../users/entities/user.entity';
import { Department } from '../departments/entities/department.entity';
import { Province } from '../provinces/entities/province.entity';
import { DepartmentsService } from '../departments/departments.service';
import { ActivityLogService } from '../admin/services/activity-log.service';
import { forwardRef, Inject } from '@nestjs/common';
import { UpdateTaskStatusDto } from './dto/update-task-status.dto';
import { UpdateTaskPriorityDto } from './dto/update-task-priority.dto';
import { UsersService } from '../users/users.service';
import { ActivityLog } from '../admin/entities/activity-log.entity';
import { DelegateTaskDto } from './dto/delegate-task.dto';
import { DeleteTaskDto } from './dto/delete-task.dto';
import { RecycleBinQueryDto } from './dto/recycle-bin-query.dto';

// Define the missing Response Type
export interface DashboardTasksResponse {
  myPersonalTasks: Task[];
  tasksICreatedForOthers: Task[];
  tasksAssignedToMe: Task[];
  tasksAssignedToMyDepartments: Task[];
  tasksDelegatedByMe: Task[];
  tasksDelegatedToMe: Task[];
}

// Define structure for status counts
export interface TaskStatusCounts {
  [TaskStatus.PENDING]: number;
  [TaskStatus.IN_PROGRESS]: number;
  [TaskStatus.COMPLETED]: number;
  [TaskStatus.CANCELLED]: number;
  [TaskStatus.DELEGATED]?: number; // Optional, as maybe not always needed
}

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private tasksRepository: Repository<Task>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Department)
    private departmentsRepository: Repository<Department>,
    @InjectRepository(Province)
    private provincesRepository: Repository<Province>,
    @Inject(forwardRef(() => DepartmentsService))
    private departmentsService: DepartmentsService,
    @Inject(forwardRef(() => UsersService))
    private usersService: UsersService,
    @Inject(forwardRef(() => ActivityLogService))
    private activityLogService: ActivityLogService,
    @InjectRepository(ActivityLog)
    private activityLogRepository: Repository<ActivityLog>,
  ) {}

  async create(createTaskDto: CreateTaskDto, user: any): Promise<Task> {
    console.log('Creating task with DTO:', JSON.stringify(createTaskDto, null, 2));
    console.log('Creating user:', JSON.stringify(user, null, 2));

    try {
      const task = new Task();
      task.title = createTaskDto.title;
      task.description = createTaskDto.description;
      task.priority = createTaskDto.priority || TaskPriority.MEDIUM;
      task.dueDate = createTaskDto.dueDate ? new Date(createTaskDto.dueDate) : null;
      task.createdById = user.userId; // Set from the authenticated user
      task.status = TaskStatus.PENDING; // Default status
      task.isDelegated = false; // New tasks are not delegated by default
      task.assignedToUsers = []; // Initialize relations
      task.assignedToDepartments = [];
      task.assignedToProvinceId = null;

      // --- Determine Task Type and Validate Assignments ---
      const hasUsers = createTaskDto.assignedToUserIds && createTaskDto.assignedToUserIds.length > 0;
      const hasDepartments = createTaskDto.assignedToDepartmentIds && createTaskDto.assignedToDepartmentIds.length > 0;
      const hasProvince = createTaskDto.assignedToProvinceId;

      if (hasUsers && hasDepartments) {
        throw new BadRequestException('Cannot assign task to both users and departments simultaneously.');
      }
      if (hasUsers && hasProvince) {
        throw new BadRequestException('Cannot assign task to users and specify a province.');
      }
      if (!hasDepartments && hasProvince) {
        throw new BadRequestException('Province assignment requires at least one department assignment.');
      }

      if (hasUsers) {
        // USER Assignment
        task.type = TaskType.USER;
        const userIds = createTaskDto.assignedToUserIds; // Definite array here
        const users = await this.usersRepository.findBy({ id: In(userIds!) });
        if (users.length !== userIds!.length) {
            const foundIds = users.map(u => u.id);
            const notFoundIds = userIds!.filter(id => !foundIds.includes(id));
            throw new BadRequestException(`One or more assigned users not found: ${notFoundIds.join(', ')}`);
        }
        task.assignedToUsers = users;
        console.log(`Task type set to USER, assigned to ${task.assignedToUsers.length} users.`);
      } else if (hasDepartments && hasProvince) {
        // PROVINCE_DEPARTMENT Assignment
        task.type = TaskType.PROVINCE_DEPARTMENT;
        const departmentIds = createTaskDto.assignedToDepartmentIds; // Definite array here

        // Validate Province
        const province = await this.provincesRepository.findOneBy({ id: createTaskDto.assignedToProvinceId });
        if (!province) {
            throw new BadRequestException(`Province with ID ${createTaskDto.assignedToProvinceId} not found.`);
        }
        task.assignedToProvinceId = province.id;

        // Validate Departments and their link to the Province
        const departments = await this.departmentsRepository.find({
            where: { id: In(departmentIds!) },
            select: ['id', 'provinceId'] // Select only necessary fields
        });
        if (departments.length !== departmentIds!.length) {
            const foundIds = departments.map(d => d.id);
            const notFoundIds = departmentIds!.filter(id => !foundIds.includes(id));
            throw new BadRequestException(`One or more assigned departments not found: ${notFoundIds.join(', ')}`);
        }
        const invalidDepartments = departments.filter(dept => dept.provinceId !== province.id);
        if (invalidDepartments.length > 0) {
            throw new BadRequestException(`Departments [${invalidDepartments.map(d => d.id).join(', ')}] do not belong to province ${province.id}.`);
        }
        // We need the full department entities for the relation
        task.assignedToDepartments = await this.departmentsRepository.findBy({ id: In(departmentIds!) });
        console.log(`Task type set to PROVINCE_DEPARTMENT, province ${province.id}, assigned to ${task.assignedToDepartments.length} departments.`);

      } else if (hasDepartments) {
        // DEPARTMENT Assignment
        task.type = TaskType.DEPARTMENT;
        const departmentIds = createTaskDto.assignedToDepartmentIds; // Definite array here
        const departments = await this.departmentsRepository.findBy({ id: In(departmentIds!) });
        if (departments.length !== departmentIds!.length) {
            const foundIds = departments.map(d => d.id);
            const notFoundIds = departmentIds!.filter(id => !foundIds.includes(id));
            throw new BadRequestException(`One or more assigned departments not found: ${notFoundIds.join(', ')}`);
        }
        task.assignedToDepartments = departments;
        console.log(`Task type set to DEPARTMENT, assigned to ${task.assignedToDepartments.length} departments.`);
      } else {
        // PERSONAL Assignment (Default)
        task.type = TaskType.PERSONAL;
        // Assign to self if personal
        const creatorUser = await this.usersRepository.findOneBy({ id: user.userId });
        if (!creatorUser) {
            throw new NotFoundException(`Creator user with ID ${user.userId} not found.`);
        }
        task.assignedToUsers = [creatorUser]; 
        console.log('Task type set to PERSONAL, assigned to creator.');
      }
      // ----------------------------------------------

      console.log('Task object before save:', JSON.stringify(task, null, 2));
      const savedTask = await this.tasksRepository.save(task);
      console.log('Task saved successfully with ID:', savedTask.id);
      
      // Reload the task with all relations to ensure consistency
      return this.findOne(savedTask.id); 

    } catch (error) {
      console.error('Error creating task:', error);
      if (error instanceof BadRequestException || error instanceof NotFoundException || error instanceof ForbiddenException) throw error;
      throw new BadRequestException(`Failed to create task: ${error.message || 'Unknown error'}`);
    }
  }

  async findAll(query: any, user: any): Promise<Task[]> {
    try {
      let queryBuilder = this.tasksRepository.createQueryBuilder('task')
        .leftJoinAndSelect('task.createdBy', 'createdBy')
        .leftJoinAndSelect('task.assignedToUsers', 'assignedToUsers')
        .leftJoinAndSelect('task.assignedToDepartments', 'assignedToDepartments');

      // Apply explicit filters from query string
      if (query.departmentId) {
        // Ensure correct alias if task is joined with department
        // Assuming assignedToDepartments relation is correctly joined
        queryBuilder = queryBuilder.andWhere('assignedToDepartments.id = :departmentId', { departmentId: query.departmentId });
      }

      if (query.status) {
        queryBuilder = queryBuilder.andWhere('task.status = :status', { status: query.status });
      }

      // Removed context filter as it's not part of Task entity currently
      // if (query.context) {
      //   queryBuilder = queryBuilder.andWhere('task.context = :context', { context: query.context });
      // }

      const includeAll = query.include_all === 'true' || query.include_all === true;

      // --- Role-Based Filtering Logic ---
      if (user.role === UserRole.LEADERSHIP) {
        // Leadership sees all tasks, respecting only query filters applied above
        console.log(`User role is LEADERSHIP. Fetching all tasks respecting query filters.`);
      } else if (user.role === UserRole.ADMIN) {
        // Admins also see all tasks, respecting only query filters applied above
        console.log(`User role is ADMIN. Fetching all tasks respecting query filters.`);
      } else {
        // Default User Role - includes former MANAGER and GENERAL_MANAGER roles
        if (query.task_type === 'my_tasks') {
          queryBuilder = queryBuilder.andWhere('task.createdById = :userId', { userId: user.userId });
        } else if (query.task_type === 'assigned') {
          // User sees tasks directly assigned to them or to their departments
          queryBuilder = queryBuilder.andWhere(
            '(assignedToUsers.id = :userId OR assignedToDepartments.id IN (SELECT department_id FROM user_departments WHERE user_id = :userId))',
            { userId: user.userId }
          );
        } else {
          // Default: User sees tasks created by them, assigned to them, or assigned to their departments
          queryBuilder = queryBuilder.andWhere(
            '(task.createdById = :userId OR assignedToUsers.id = :userId OR assignedToDepartments.id IN (SELECT department_id FROM user_departments WHERE user_id = :userId))',
            { userId: user.userId }
          );
        }
        console.log(`User role is USER. Applying standard user filters.`);
      }
      // --- End Role-Based Filtering ---

      const tasks = await queryBuilder.getMany();
      console.log(`Found ${tasks.length} tasks with relations loaded for user ${user.userId} (${user.role})`);
      return tasks;
    } catch (error) {
      console.error('Error finding tasks:', error);
      // Consider throwing an error instead of returning empty array
      // throw new InternalServerErrorException('Failed to fetch tasks.');
      return [];
    }
  }

  async findOne(id: string): Promise<Task> {
    try {
      const task = await this.tasksRepository.findOne({
        where: { id },
        relations: [
          'createdBy',
          'assignedToUsers',
          'assignedToDepartments',
          'assignedToProvince',
          'delegatedBy',
          'delegatedFromTask'
        ]
      });

      if (!task) {
        throw new NotFoundException(`Task with ID ${id} not found`);
      }
      return task;
    } catch (error) {
      console.error(`Error finding task with ID ${id}:`, error);
      if (error instanceof NotFoundException) throw error;
      throw new NotFoundException(`Error fetching task with ID ${id}.`);
    }
  }

  // Helper to check if a user is considered an assignee (direct, via department, or via province/department)
  private async checkAssigneePermission(task: Task, userId: string): Promise<boolean> {
    // Check direct user assignment
    if (task.assignedToUsers && task.assignedToUsers.some(user => user.id === userId)) {
      return true;
    }

    // Check department-only assignment (TaskType.DEPARTMENT)
    if (task.type === TaskType.DEPARTMENT && task.assignedToDepartments && task.assignedToDepartments.length > 0) {
        const userWithDepartments = await this.usersRepository.findOne({
            where: { id: userId },
            relations: ['departments']
        });
        if (!userWithDepartments || !userWithDepartments.departments) return false;

        const userDepartmentIds = userWithDepartments.departments.map(dept => dept.id);
        const taskDepartmentIds = task.assignedToDepartments.map(dept => dept.id);
        if (taskDepartmentIds.some(taskDeptId => userDepartmentIds.includes(taskDeptId))) {
            return true;
        }
    }

    // Check province/department assignment (TaskType.PROVINCE_DEPARTMENT)
    if (task.type === TaskType.PROVINCE_DEPARTMENT && task.assignedToProvinceId && task.assignedToDepartments && task.assignedToDepartments.length > 0) {
        const userWithDepartments = await this.usersRepository.findOne({
            where: { id: userId },
            relations: ['departments'] // We need department provinceId
        });
        if (!userWithDepartments || !userWithDepartments.departments) return false;

        // Filter user's departments to only those belonging to the task's province
        const userDepartmentIdsInProvince = userWithDepartments.departments
            .filter(dept => dept.provinceId === task.assignedToProvinceId)
            .map(dept => dept.id);

        if (userDepartmentIdsInProvince.length === 0) return false; // User has no departments in the target province

        const taskDepartmentIds = task.assignedToDepartments.map(dept => dept.id);

        // Check if user belongs to any of the *specific* departments assigned within that province
        if (taskDepartmentIds.some(taskDeptId => userDepartmentIdsInProvince.includes(taskDeptId))) {
             return true;
        }
    }

    return false; // Not an assignee by any relevant mechanism
  }

  async update(id: string, updateTaskDto: UpdateTaskDto, reqUser: any): Promise<Task> {
    const task = await this.findOne(id); // findOne already loads relations

    // --- Permission Check: Only creator or Admin/Leadership can edit general details ---
    const isCreator = task.createdById === reqUser.userId;
    const isAdminOrLeadership = [UserRole.ADMIN, UserRole.LEADERSHIP].includes(reqUser.role);
    if (!isCreator && !isAdminOrLeadership) {
        throw new ForbiddenException('Only the task creator, admin, or leadership can edit the task details.');
    }
    // --- End Permission Check ---

    // Store original state for logging
    const originalTaskJson = JSON.stringify(task); // Simple way to capture original state

    // Update allowed fields from DTO
    // IMPORTANT: Do not allow changing priority, status, or assignments via this general update endpoint.
    let changed = false;
    if (updateTaskDto.title !== undefined && task.title !== updateTaskDto.title) {
        task.title = updateTaskDto.title;
        changed = true;
    }
    if (updateTaskDto.description !== undefined && task.description !== updateTaskDto.description) {
        task.description = updateTaskDto.description;
        changed = true;
    }
    const newDueDate = updateTaskDto.dueDate ? new Date(updateTaskDto.dueDate) : null;
    const currentDueDate = task.dueDate;
    // Compare dates carefully
    if ( (newDueDate === null && currentDueDate !== null) ||
         (newDueDate !== null && currentDueDate === null) ||
         (newDueDate && currentDueDate && newDueDate.getTime() !== currentDueDate.getTime()) )
    {
        task.dueDate = newDueDate;
        changed = true;
    }


    // Log changes if any occurred
    if (changed) {
        await this.activityLogService.createLog({
            action: `Task Details Updated`,
            target: 'Task',
            target_id: task.id,
            user_id: reqUser.userId,
            details: `Details for task "${task.title}" (ID: ${task.id}) were updated.`,
            status: 'success'
        });
        const updatedTask = await this.tasksRepository.save(task);
         return this.findOne(updatedTask.id); // Return task with relations
    } else {
      console.log(`No changes detected for task ${id}. Skipping save.`);
      return task; // Return original task if no changes
    }
  }

  async updateStatus(id: string, updateTaskStatusDto: UpdateTaskStatusDto, reqUser: any): Promise<Task> {
    const task = await this.findOne(id); // Ensure relations are loaded
    const { status, cancellationReason } = updateTaskStatusDto;
    const originalStatus = task.status;

    if (originalStatus === status) {
        console.warn(`Task ${id} is already in status ${status}. No update performed.`);
        return task; // Return task unchanged
    }

    // --- Permission Check ---
    const isCreator = task.createdById === reqUser.userId;
    const isAssignee = await this.checkAssigneePermission(task, reqUser.userId);
    const isAdminOrLeadership = [UserRole.ADMIN, UserRole.LEADERSHIP].includes(reqUser.role);

    let canChangeStatus = false;

    // Rule: Only creator or admin/leadership can cancel
    if (status === TaskStatus.CANCELLED) {
        if (isCreator || isAdminOrLeadership) {
            // Check for cancellation reason
            if (!cancellationReason || cancellationReason.length < 20) {
                throw new BadRequestException('A detailed cancellation reason (at least 20 characters) is required');
            }
            
            canChangeStatus = true;
            
            // Set cancellation metadata
            task.cancelledAt = new Date();
            task.cancelledById = reqUser.userId;
            task.cancellationReason = cancellationReason;
        } else {
            throw new ForbiddenException('Only the task creator, admin, or leadership can cancel the task.');
        }
         if (task.status === TaskStatus.COMPLETED) {
              throw new BadRequestException(`Cannot cancel a task that is already completed.`);
         }
    }
    // Rule: Assignee or creator (or admin/leadership) can move between PENDING, IN_PROGRESS, COMPLETED
    else if ([TaskStatus.PENDING, TaskStatus.IN_PROGRESS, TaskStatus.COMPLETED].includes(status)) {
        // Anyone involved (creator, assignee) or with override power (admin/leadership) can manage the active lifecycle.
        if (isCreator || isAssignee || isAdminOrLeadership) {
            // Prevent moving *from* CANCELLED unless creator/admin/leadership
            if (originalStatus === TaskStatus.CANCELLED && !isCreator && !isAdminOrLeadership) {
                throw new ForbiddenException('Only the creator, admin, or leadership can move a task from Cancelled status.');
            }
            // Prevent moving *from* DELEGATED manually (should happen via delegation logic)
             if (originalStatus === TaskStatus.DELEGATED) {
                 throw new BadRequestException('Cannot manually change status from DELEGATED.');
             }
            canChangeStatus = true;
        } else {
            throw new ForbiddenException('You do not have permission to change the status of this task.');
        }
    }
    // Rule: Only delegation logic should set DELEGATED status
    else if (status === TaskStatus.DELEGATED) {
         throw new BadRequestException('Task status cannot be manually set to DELEGATED.');
    }
     else {
         throw new BadRequestException(`Invalid target status: ${status}`);
    }

    if (!canChangeStatus) {
         // This case should ideally be caught by specific throws above, but acts as a safeguard.
         throw new ForbiddenException('Status update not permitted by rules.');
    }
    // --- End Permission Check ---

    task.status = status;

    // If completing the task, set completedAt
    if (status === TaskStatus.COMPLETED) {
        task.completedAt = new Date();
    }

    // Add activity log entry
    await this.activityLogService.createLog({
        action: `Task Status Changed`,
        target: 'Task',
        target_id: task.id,
        user_id: reqUser.userId,
        details: `Status of task "${task.title}" (ID: ${task.id}) changed from ${originalStatus} to ${status}.${status === TaskStatus.CANCELLED ? ` Reason: ${cancellationReason}` : ''}`,
        status: 'success'
    });

    const updatedTask = await this.tasksRepository.save(task);
    return this.findOne(updatedTask.id); // Return with relations
  }

  async updatePriority(id: string, updateTaskPriorityDto: UpdateTaskPriorityDto, reqUser: any): Promise<Task> {
    const task = await this.findOne(id);
    const { priority } = updateTaskPriorityDto;
    const originalPriority = task.priority;

    if (originalPriority === priority) {
        console.warn(`Task ${id} already has priority ${priority}. No update performed.`);
        return task;
    }

    // --- Permission Check: Only creator or admin/leadership can change priority ---
    const isCreator = task.createdById === reqUser.userId;
    const isAdminOrLeadership = [UserRole.ADMIN, UserRole.LEADERSHIP].includes(reqUser.role);

    if (!isCreator && !isAdminOrLeadership) {
        throw new ForbiddenException('Only the task creator, admin, or leadership can change the priority.');
    }
    // --- End Permission Check ---

    task.priority = priority;

     // Add activity log entry
    await this.activityLogService.createLog({
        action: `Task Priority Changed`,
        target: 'Task',
        target_id: task.id,
        user_id: reqUser.userId,
        details: `Priority of task "${task.title}" (ID: ${task.id}) changed from ${originalPriority} to ${priority}.`,
        status: 'success'
    });

    const updatedTask = await this.tasksRepository.save(task);
    return this.findOne(updatedTask.id); // Return with relations
  }

  async remove(id: string, deleteTaskDto: DeleteTaskDto, reqUser: any): Promise<void> {
    const task = await this.findOne(id); // Ensures task exists and loads createdById

    // --- Permission Check: Only creator or admin/leadership can delete ---
    const isCreator = task.createdById === reqUser.userId;
    const isAdminOrLeadership = [UserRole.ADMIN, UserRole.LEADERSHIP].includes(reqUser.role);

    if (!isCreator && !isAdminOrLeadership) {
        throw new ForbiddenException('Only the task creator, admin, or leadership can delete this task.');
    }
    // --- End Permission Check ---

    // Validate deletion reason
    if (!deleteTaskDto.deletionReason || deleteTaskDto.deletionReason.length < 20) {
        throw new BadRequestException('A detailed deletion reason (at least 20 characters) is required');
    }

    // Implement soft delete
    task.isDeleted = true;
    task.status = TaskStatus.DELETED;
    task.deletedAt = new Date();
    task.deletedById = reqUser.userId;
    task.deletionReason = deleteTaskDto.deletionReason;

    // Add activity log entry for soft deletion
    await this.activityLogService.createLog({
        action: `Task Deleted`,
        target: 'Task',
        target_id: id,
        user_id: reqUser.userId,
        details: `Task "${task.title}" (ID: ${id}) was moved to recycle bin. Reason: ${deleteTaskDto.deletionReason}`,
        status: 'warning'
    });

    await this.tasksRepository.save(task);
  }

  async hardRemove(id: string, reqUser: any): Promise<void> {
    // Only admin can permanently delete tasks
    if (reqUser.role !== UserRole.ADMIN) {
        throw new ForbiddenException('Only administrators can permanently delete tasks.');
    }

    const task = await this.findOne(id);
    
    // Add activity log entry BEFORE hard deleting
    await this.activityLogService.createLog({
        action: `Task Permanently Deleted`,
        target: 'Task',
        target_id: id,
        user_id: reqUser.userId,
        details: `Task "${task.title}" (ID: ${id}) was permanently deleted from the system.`,
        status: 'warning'
    });

    const result = await this.tasksRepository.delete(id);

    if (result.affected === 0) {
      throw new NotFoundException(`Task with ID ${id} could not be deleted.`);
    }
  }

  async restoreTask(id: string, reqUser: any): Promise<Task> {
    // Only admin or leadership can restore tasks
    if (![UserRole.ADMIN, UserRole.LEADERSHIP].includes(reqUser.role)) {
        throw new ForbiddenException('Only administrators or leadership can restore deleted tasks.');
    }

    const task = await this.findOne(id);
    
    if (!task.isDeleted) {
        throw new BadRequestException('Task is not in recycle bin.');
    }

    // Restore task to original status before deletion
    task.isDeleted = false;
    task.status = TaskStatus.PENDING; // Reset to pending
    task.deletedAt = null;
    
    // Keep deletedById and deletionReason for audit trail

    // Add activity log entry
    await this.activityLogService.createLog({
        action: `Task Restored`,
        target: 'Task',
        target_id: id,
        user_id: reqUser.userId,
        details: `Task "${task.title}" (ID: ${id}) was restored from the recycle bin.`,
        status: 'success'
    });

    const restoredTask = await this.tasksRepository.save(task);
    return this.findOne(restoredTask.id);
  }

  async findAllDeleted(query: RecycleBinQueryDto, reqUser: any): Promise<[Task[], number]> {
    // Only admin or leadership can view recycled tasks
    if (![UserRole.ADMIN, UserRole.LEADERSHIP].includes(reqUser.role)) {
        throw new ForbiddenException('Only administrators or leadership can access the recycle bin.');
    }

    const queryBuilder = this.tasksRepository.createQueryBuilder('task')
        .leftJoinAndSelect('task.createdBy', 'createdBy')
        .leftJoinAndSelect('task.deletedBy', 'deletedBy')
        .leftJoinAndSelect('task.assignedToUsers', 'assignedToUsers')
        .leftJoinAndSelect('task.assignedToDepartments', 'assignedToDepartments')
        .leftJoinAndSelect('task.assignedToProvince', 'assignedToProvince')
        .where('task.isDeleted = :isDeleted', { isDeleted: true });

    // Apply search filters
    if (query.search) {
        queryBuilder.andWhere('(task.title LIKE :search OR task.description LIKE :search OR task.deletionReason LIKE :search)', 
          { search: `%${query.search}%` });
    }

    // Filter by user
    if (query.userId) {
        queryBuilder.andWhere('task.createdById = :userId', { userId: query.userId });
    }

    // Filter by department
    if (query.departmentId) {
        queryBuilder.andWhere('assignedToDepartments.id = :departmentId', { departmentId: query.departmentId });
    }

    // Filter by province
    if (query.provinceId) {
        queryBuilder.andWhere('(task.assignedToProvinceId = :provinceId OR assignedToDepartments.provinceId = :provinceId)', 
          { provinceId: query.provinceId });
    }

    // Filter by deleted user
    if (query.deletedByUserId) {
        queryBuilder.andWhere('task.deletedById = :deletedByUserId', { deletedByUserId: query.deletedByUserId });
    }

    // Filter by date range
    if (query.fromDate) {
        queryBuilder.andWhere('task.deletedAt >= :fromDate', { fromDate: new Date(query.fromDate) });
    }
    if (query.toDate) {
        queryBuilder.andWhere('task.deletedAt <= :toDate', { toDate: new Date(query.toDate) });
    }

    // Apply sorting
    const sortBy = query.sortBy || 'deletedAt';
    const sortOrder = query.sortOrder || 'DESC';
    queryBuilder.orderBy(`task.${sortBy}`, sortOrder as 'ASC' | 'DESC');

    // Apply pagination
    const page = query.page ? parseInt(query.page, 10) : 1;
    const limit = query.limit ? parseInt(query.limit, 10) : 10;
    const skip = (page - 1) * limit;

    queryBuilder.skip(skip).take(limit);

    // Execute query and return paginated results
    const [tasks, total] = await queryBuilder.getManyAndCount();
    return [tasks, total];
  }

  async delegateTask(id: string, dto: DelegateTaskDto, delegatorInfo: any): Promise<Task[]> {
    const logContext = `[TasksService.delegateTask TaskID: ${id}, Delegator: ${delegatorInfo.userId}]`;
    console.log(`${logContext} Starting delegation with DTO:`, dto);

    const originalTask = await this.tasksRepository.findOne({
        where: { id },
        relations: ['createdBy'], // Only need creator for permissions
    });

    if (!originalTask) {
        console.error(`${logContext} Original task not found.`);
        throw new NotFoundException('Original task not found');
    }

    // Permissions check: Only creator, admin, or leadership can delegate
    const isCreator = originalTask.createdById === delegatorInfo.userId;
    const isAdmin = delegatorInfo.role === UserRole.ADMIN;
    const isLeadership = delegatorInfo.role === UserRole.LEADERSHIP;

    // Re-adding assignee check - delegation should be allowed by current assignee too
    const isAssignee = await this.checkAssigneePermission(originalTask, delegatorInfo.userId); 

    if (!isCreator && !isAdmin && !isLeadership && !isAssignee) {
        console.warn(`${logContext} User does not have permission to delegate.`);
        throw new ForbiddenException('Only the creator, an assignee, admin, or leadership can delegate this task.');
    }

    // Prevent delegating already delegated or completed/cancelled tasks
    if (originalTask.isDelegated) {
        throw new BadRequestException('This task has already been delegated.');
    }
    if ([TaskStatus.COMPLETED, TaskStatus.CANCELLED].includes(originalTask.status)) {
        throw new BadRequestException('Cannot delegate a completed or cancelled task.');
    }

    // Validate target users exist (using newAssigneeUserIds - already validated by DTO decorator)
    const newAssignees = await this.usersRepository.findBy({ id: In(dto.newAssigneeUserIds) });
    if (newAssignees.length !== dto.newAssigneeUserIds.length) {
        const foundIds = newAssignees.map(u => u.id);
        const notFoundIds = dto.newAssigneeUserIds.filter(uid => !foundIds.includes(uid));
        console.error(`${logContext} One or more target users not found: ${notFoundIds.join(', ')}`);
        throw new BadRequestException(`One or more target users not found: ${notFoundIds.join(', ')}`);
    }

    // --- Create New Delegated Tasks --- (Simplified)
    const createdDelegatedTasks: Task[] = [];

    for (const assignee of newAssignees) {
        const newTask = new Task();
        newTask.title = originalTask.title; // Inherit title
        newTask.description = originalTask.description; // Inherit description
        newTask.priority = originalTask.priority; // Inherit priority
        newTask.dueDate = originalTask.dueDate; // Inherit due date
        newTask.status = TaskStatus.PENDING; // Start as Pending
        newTask.createdById = delegatorInfo.userId; // Delegator is creator
        newTask.delegatedFromTaskId = originalTask.id; // Link to original
        newTask.delegatedByUserId = delegatorInfo.userId; // Mark delegator
        newTask.isDelegated = true;
        newTask.type = TaskType.USER; // Delegated task is assigned to a user
        newTask.assignedToUsers = [assignee]; // Assign only to this specific assignee
        newTask.assignedToDepartments = []; // Clear department/province assignments
        newTask.assignedToProvinceId = null;

        createdDelegatedTasks.push(newTask);
    }
    // --- End Create New Delegated Tasks ---

    // Update original task status
    originalTask.status = TaskStatus.DELEGATED;
    originalTask.isDelegated = true; // Also mark original as delegated

    // --- Database Transaction --- 
    try {
        // Save the original task with updated status
        const savedOriginalTask = await this.tasksRepository.save(originalTask);

        // Save all the new delegated tasks
        const savedNewTasks = await this.tasksRepository.save(createdDelegatedTasks);

        // Log activity
        const newTasksSummary = savedNewTasks.map(t => `"${t.title}" (ID: ${t.id}) for ${t.assignedToUsers[0]?.username}`).join(', ');
        await this.activityLogService.createLog({
            action: `Task Delegated`,
            target: 'Task',
            target_id: originalTask.id,
            user_id: delegatorInfo.userId,
            details: `Task "${originalTask.title}" (ID: ${originalTask.id}) was delegated. New task(s) created: ${newTasksSummary}. Reason: ${dto.delegationReason || 'N/A'}`,
            status: 'success'
        });

        // Reload and return tasks
        const reloadedOriginal = await this.findOne(savedOriginalTask.id);
        const reloadedNewTasks = await Promise.all(savedNewTasks.map(t => this.findOne(t.id)));
        return [reloadedOriginal, ...reloadedNewTasks];

    } catch (err) {
        console.error("Delegation save failed:", err);
        throw new BadRequestException(`Failed to delegate task: ${err.message || 'Database error'}`);
    } 
    // --- End Transaction ---
  }

  async getDashboardTasks(userId: string): Promise<DashboardTasksResponse> {
    try {
      const user = await this.usersRepository.findOne({
        where: { id: userId },
        relations: ['departments']
      });

      if (!user) {
        throw new NotFoundException(`User with ID ${userId} not found.`);
      }

      const departmentIds = user.departments ? user.departments.map(d => d.id) : [];

      // Fetch tasks using updated helper methods
      const myPersonalTasks = await this.getMyPersonalTasks(userId);
      const tasksICreatedForOthers = await this.getTasksCreatedByUserForOthers(userId);
      const tasksAssignedToMe = await this.getTasksAssignedToUserExplicitly(userId);
      const tasksAssignedToMyDepartments = await this.getTasksForDepartments(departmentIds);
      const tasksDelegatedByMe = await this.getTasksDelegatedByUser(userId);
      const tasksDelegatedToMe = await this.getTasksDelegatedToUser(userId);

      const response = {
        myPersonalTasks,
        tasksICreatedForOthers,
        tasksAssignedToMe,
        tasksAssignedToMyDepartments,
        tasksDelegatedByMe,
        tasksDelegatedToMe,
      };

      console.log(`[TasksService] Dashboard data lengths: Personal=${response.myPersonalTasks.length}, Created=${response.tasksICreatedForOthers.length}, Assigned=${response.tasksAssignedToMe.length}, DeptTasks=${response.tasksAssignedToMyDepartments.length}, DelegatedBy=${response.tasksDelegatedByMe.length}, DelegatedTo=${response.tasksDelegatedToMe.length}`);

      return response;

    } catch (error) {
      console.error(`[TasksService] Error fetching dashboard tasks for user ${userId}:`, error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(`Failed to retrieve dashboard tasks: ${error.message}`);
    }
  }

  // --- Updated Helper methods for Dashboard ---

  async getMyPersonalTasks(userId: string): Promise<Task[]> {
    console.log(`Fetching personal tasks for user ${userId}`);
    try {
      return await this.tasksRepository.find({
        where: { createdById: userId, type: TaskType.PERSONAL, isDelegated: false },
        relations: ['assignedToUsers', 'assignedToDepartments', 'assignedToProvince', 'delegatedBy', 'createdBy'],
        order: { createdAt: 'DESC' }
      });
    } catch (error) {
      console.error(`Error fetching personal tasks for user ${userId}:`, error);
      throw new Error(`Failed to fetch personal tasks: ${error.message}`);
    }
  }
  
  async getTasksAssignedToUserExplicitly(userId: string): Promise<Task[]> {
    console.log(`Fetching tasks assigned explicitly (non-personal) to user ${userId}`);
    try {
      return await this.tasksRepository.createQueryBuilder('task')
        .innerJoin('task.assignedToUsers', 'user')
        .where('user.id = :userId', { userId })
        .andWhere('task.type != :personalType', { personalType: TaskType.PERSONAL })
        .andWhere('task.isDelegated = :isDelegated', { isDelegated: false })
        .leftJoinAndSelect('task.createdBy', 'createdBy')
        .leftJoinAndSelect('task.assignedToDepartments', 'assignedToDepartments')
        .leftJoinAndSelect('task.assignedToProvince', 'assignedToProvince')
        .leftJoinAndSelect('task.delegatedBy', 'delegatedBy')
        .orderBy('task.createdAt', 'DESC')
        .getMany();
    } catch (error) {
      console.error(`Error fetching non-personal tasks assigned to user ${userId}:`, error);
      throw new Error(`Failed to fetch assigned non-personal tasks: ${error.message}`);
    }
  }

  async getTasksCreatedByUserForOthers(userId: string): Promise<Task[]> {
    console.log(`Fetching tasks created by user ${userId} for others (non-personal)`);
    try {
      return await this.tasksRepository.find({
        where: { 
          createdById: userId, 
          type: Not(TaskType.PERSONAL), // Use TypeORM's Not operator
          isDelegated: false 
        },
        relations: ['assignedToUsers', 'assignedToDepartments', 'assignedToProvince', 'delegatedBy', 'createdBy'],
        order: { createdAt: 'DESC' }
      });
    } catch (error) {
      console.error(`Error fetching non-personal tasks created by user ${userId}:`, error);
      throw new Error(`Failed to fetch created non-personal tasks: ${error.message}`);
    }
  }

  // NEW Helper method to get tasks for multiple department IDs
  async getTasksForDepartments(departmentIds: string[]): Promise<Task[]> {
    if (!departmentIds || departmentIds.length === 0) {
        return [];
    }
    console.log(`[TasksService] Fetching tasks for departments: ${departmentIds.join(', ')}`);
    try {
        return await this.tasksRepository.createQueryBuilder('task')
            .innerJoin('task.assignedToDepartments', 'department')
            .where('department.id IN (:...departmentIds)', { departmentIds })
            .leftJoinAndSelect('task.createdBy', 'createdBy')
            .leftJoinAndSelect('task.assignedToUsers', 'assignedToUsers')
            .leftJoinAndSelect('task.assignedToDepartments', 'assignedToDepartments_rel') // Re-select for full data
            .orderBy('task.createdAt', 'DESC')
            .getMany();
    } catch (error) {
        console.error(`[TasksService] Error fetching tasks for departments ${departmentIds.join(', ')}:`, error);
        return []; // Return empty array on error
    }
  }

  // START: Implement Specific Task Fetch Methods
  async getTasksAssignedToUser(userId: string): Promise<Task[]> {
    console.log(`Fetching tasks assigned directly to user ${userId}`);
    try {
      // Use query builder for explicit alias
      return await this.tasksRepository.createQueryBuilder('task')
        .innerJoin('task.assignedToUsers', 'user') // Alias the joined user table as 'user'
        .where('user.id = :userId', { userId }) // Use alias in where clause
        .andWhere('task.isDelegated = :isDelegated', { isDelegated: false })
        .leftJoinAndSelect('task.createdBy', 'createdBy')
        .leftJoinAndSelect('task.assignedToDepartments', 'assignedToDepartments')
        .leftJoinAndSelect('task.assignedToProvince', 'assignedToProvince')
        .leftJoinAndSelect('task.delegatedBy', 'delegatedBy')
        .orderBy('task.createdAt', 'DESC')
        .getMany();
    } catch (error) {
      console.error(`Error fetching tasks assigned to user ${userId}:`, error);
      throw new Error(`Failed to fetch assigned tasks: ${error.message}`);
    }
  }

  async getTasksCreatedByUser(userId: string): Promise<Task[]> {
    console.log(`Fetching tasks created by user ${userId}`);
    try {
      // This one seems okay as it uses a direct column ID
      return await this.tasksRepository.find({
        where: { createdById: userId, isDelegated: false },
        relations: ['assignedToUsers', 'assignedToDepartments', 'assignedToProvince', 'delegatedBy', 'createdBy'],
        order: { createdAt: 'DESC' }
      });
    } catch (error) {
      console.error(`Error fetching tasks created by user ${userId}:`, error);
      throw new Error(`Failed to fetch created tasks: ${error.message}`);
    }
  }

  async getTasksDelegatedByUser(userId: string): Promise<Task[]> {
    console.log(`Fetching tasks delegated by user ${userId}`);
    try {
      // This one seems okay as it uses a direct column ID
      return await this.tasksRepository.find({
        where: { delegatedByUserId: userId, isDelegated: true },
        relations: ['createdBy', 'assignedToUsers', 'assignedToDepartments', 'assignedToProvince', 'delegatedBy', 'delegatedFromTask'],
        order: { createdAt: 'DESC' }
      });
    } catch (error) {
      console.error(`Error fetching tasks delegated by user ${userId}:`, error);
      throw new Error(`Failed to fetch tasks delegated by user: ${error.message}`);
    }
  }

  async getTasksDelegatedToUser(userId: string): Promise<Task[]> {
    console.log(`Fetching tasks delegated to user ${userId}`);
    try {
      // Use query builder for explicit alias
      return await this.tasksRepository.createQueryBuilder('task')
        .innerJoin('task.assignedToUsers', 'user') // Alias the joined user table as 'user'
        .where('user.id = :userId', { userId }) // Use alias in where clause
        .andWhere('task.isDelegated = :isDelegated', { isDelegated: true })
        .leftJoinAndSelect('task.createdBy', 'createdBy')
        .leftJoinAndSelect('task.assignedToDepartments', 'assignedToDepartments')
        .leftJoinAndSelect('task.assignedToProvince', 'assignedToProvince')
        .leftJoinAndSelect('task.delegatedBy', 'delegatedBy')
        .leftJoinAndSelect('task.delegatedFromTask', 'delegatedFromTask')
        .orderBy('task.createdAt', 'DESC')
        .getMany();
    } catch (error) {
      console.error(`Error fetching tasks delegated to user ${userId}:`, error);
      throw new Error(`Failed to fetch tasks delegated to user: ${error.message}`);
    }
  }
  // END: Implement Specific Task Fetch Methods

  // START: Implement Department/User/Province Task Fetch Methods
  async getTasksForDepartment(departmentId: string): Promise<Task[]> {
    console.log(`Fetching tasks for department ${departmentId}`);
    try {
      // Validate department exists first (optional, depends on desired behavior)
      // await this.departmentsRepository.findOneByOrFail({ id: departmentId }); 
      
      return await this.tasksRepository.find({
        where: {
          assignedToDepartments: { id: departmentId }
        },
        relations: ['createdBy', 'assignedToUsers', 'assignedToDepartments', 'assignedToProvince', 'delegatedBy', 'delegatedFromTask'],
        order: { createdAt: 'DESC' }
      });
    } catch (error) {
      console.error(`Error fetching tasks for department ${departmentId}:`, error);
      // Re-throw NotFoundException if department validation fails
      if (error instanceof NotFoundException) throw error;
      throw new Error(`Failed to fetch tasks for department ${departmentId}: ${error.message}`);
    }
  }

  async getTasksForUser(userId: string): Promise<Task[]> {
    console.log(`Fetching tasks assigned to user ${userId}`);
    try {
      // Validate user exists first (optional)
      // await this.usersRepository.findOneByOrFail({ id: userId });

      return await this.tasksRepository.find({
        where: {
          assignedToUsers: { id: userId }
        },
        relations: ['createdBy', 'assignedToUsers', 'assignedToDepartments', 'assignedToProvince', 'delegatedBy', 'delegatedFromTask'],
        order: { createdAt: 'DESC' }
      });
    } catch (error) {
      console.error(`Error fetching tasks for user ${userId}:`, error);
      if (error instanceof NotFoundException) throw error;
      throw new Error(`Failed to fetch tasks for user ${userId}: ${error.message}`);
    }
  }

  async getTasksForProvince(provinceId: string): Promise<Task[]> {
    console.log(`Fetching tasks for province ${provinceId}`);
    try {
      // Validate province exists (optional)
      // await this.provincesRepository.findOneByOrFail({ id: provinceId });

      // Find tasks directly assigned to the province OR assigned to departments within that province
      return await this.tasksRepository.find({
        where: [
          { assignedToProvinceId: provinceId }, // Directly assigned to province (unlikely with current create logic, but good future proofing)
          { assignedToDepartments: { provinceId: provinceId } } // Assigned to departments linked to this province
        ],
        relations: ['createdBy', 'assignedToUsers', 'assignedToDepartments', 'assignedToProvince', 'delegatedBy', 'delegatedFromTask'],
        order: { createdAt: 'DESC' }
      });
    } catch (error) {
      console.error(`Error fetching tasks for province ${provinceId}:`, error);
      if (error instanceof NotFoundException) throw error;
      throw new Error(`Failed to fetch tasks for province ${provinceId}: ${error.message}`);
    }
  }
  // END: Implement Department/User/Province Task Fetch Methods

  // START: NEW Methods for Aggregated Status Counts

  async getTaskCountsByStatusForDepartment(departmentId: string): Promise<TaskStatusCounts> {
    console.log(`[TasksService] Calculating task counts by status for department ${departmentId}`);
    try {
        const counts = await this.tasksRepository.createQueryBuilder('task')
            .select('task.status', 'status')
            .addSelect('COUNT(task.id)', 'count')
            .innerJoin('task.assignedToDepartments', 'department')
            .where('department.id = :departmentId', { departmentId })
            .groupBy('task.status')
            .getRawMany(); // [{ status: 'PENDING', count: '5' }, ...]

        // Initialize counts object
        const statusCounts: TaskStatusCounts = {
            [TaskStatus.PENDING]: 0,
            [TaskStatus.IN_PROGRESS]: 0,
            [TaskStatus.COMPLETED]: 0,
            [TaskStatus.CANCELLED]: 0,
            [TaskStatus.DELEGATED]: 0,
        };

        counts.forEach(row => {
            if (statusCounts.hasOwnProperty(row.status)) {
                statusCounts[row.status as TaskStatus] = parseInt(row.count, 10);
            }
        });

        console.log(`[TasksService] Counts for department ${departmentId}:`, statusCounts);
        return statusCounts;

    } catch (error) {
        console.error(`[TasksService] Error calculating task counts for department ${departmentId}:`, error);
        throw new Error(`Failed to calculate task counts for department: ${error.message}`);
    }
  }


  async getTaskCountsByStatusForUser(userId: string): Promise<TaskStatusCounts> {
      console.log(`[TasksService] Calculating task counts by status for user ${userId}`);
      try {
          const counts = await this.tasksRepository.createQueryBuilder('task')
              .select('task.status', 'status')
              .addSelect('COUNT(task.id)', 'count')
              .innerJoin('task.assignedToUsers', 'user')
              .where('user.id = :userId', { userId })
              .groupBy('task.status')
              .getRawMany(); // [{ status: 'PENDING', count: '3' }, ...]

          // Initialize counts object
          const statusCounts: TaskStatusCounts = {
              [TaskStatus.PENDING]: 0,
              [TaskStatus.IN_PROGRESS]: 0,
              [TaskStatus.COMPLETED]: 0,
              [TaskStatus.CANCELLED]: 0,
              [TaskStatus.DELEGATED]: 0,
          };

          counts.forEach(row => {
              if (statusCounts.hasOwnProperty(row.status)) {
                  statusCounts[row.status as TaskStatus] = parseInt(row.count, 10);
              }
          });

          console.log(`[TasksService] Counts for user ${userId}:`, statusCounts);
          return statusCounts;

      } catch (error) {
          console.error(`[TasksService] Error calculating task counts for user ${userId}:`, error);
          throw new Error(`Failed to calculate task counts for user: ${error.message}`);
      }
  }

  // END: NEW Methods for Aggregated Status Counts
}
