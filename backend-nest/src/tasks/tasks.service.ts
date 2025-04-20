import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository, SelectQueryBuilder } from 'typeorm';
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
      } else if (user.role === UserRole.MANAGER || user.role === UserRole.GENERAL_MANAGER) {
        // Manager/GM specific logic (seems complex, verify if still needed/correct)
        // This part might need review based on actual requirements for managers
        if (query.task_type === 'my_tasks' && !includeAll) {
          queryBuilder = queryBuilder.andWhere('task.createdById = :userId', { userId: user.userId });
        } else if (query.task_type === 'assigned' && !includeAll) {
           // Check both direct user assignment and department assignment
           queryBuilder = queryBuilder.andWhere(
               '(assignedToUsers.id = :userId OR assignedToDepartments.id IN (SELECT department_id FROM user_departments WHERE user_id = :userId))',
               { userId: user.userId }
           );
        } else {
           // If include_all or no specific type, show all they can manage?
           // This needs clarification - for now, let's assume they see tasks created by them,
           // assigned to them, or assigned to their departments.
           queryBuilder = queryBuilder.andWhere(
               '(task.createdById = :userId OR assignedToUsers.id = :userId OR assignedToDepartments.id IN (SELECT department_id FROM user_departments WHERE user_id = :userId))',
               { userId: user.userId }
           );
        }
        console.log(`User role is ${user.role}. Applying manager filters.`);
      } else {
        // Default User Role
        if (query.task_type === 'my_tasks') {
          queryBuilder = queryBuilder.andWhere('task.createdById = :userId', { userId: user.userId });
        } else if (query.task_type === 'assigned') {
          // User sees tasks directly assigned to them
          queryBuilder = queryBuilder.andWhere('assignedToUsers.id = :userId', { userId: user.userId });
        } else {
          // Default: User sees tasks created by them OR assigned to them
          queryBuilder = queryBuilder.andWhere(
            '(task.createdById = :userId OR assignedToUsers.id = :userId)',
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

  // Helper function for assignee permission checks
  private async checkAssigneePermission(taskId: string, userId: string): Promise<boolean> {
    console.log(`Checking assignee permission for task ${taskId} and user ${userId}`);
    // 1. Fetch the task with assignees (users and departments)
    const task = await this.findOne(taskId); // findOne already throws NotFoundException

    // 2. Check direct user assignment (including delegated tasks assigned to user)
    if (task.assignedToUsers?.some(assignedUser => assignedUser.id === userId)) {
        console.log(`Permission granted: User ${userId} is directly assigned.`);
        return true;
    }

    // 3. Check department assignment
    if (task.assignedToDepartments?.length > 0) {
        // Fetch the user with their department relations
        const user = await this.usersRepository.findOne({ 
            where: { id: userId },
            relations: ['departments'] // Load the departments relation
        });
        
        if (!user || !user.departments || user.departments.length === 0) {
            console.log(`Permission check: User ${userId} not found or has no departments.`);
            return false; // User not found or has no departments
        }
        
        // Get IDs of departments the user belongs to
        const userDepartmentIds = user.departments.map(dept => dept.id);
        // Get IDs of departments the task is assigned to
        const taskDepartmentIds = task.assignedToDepartments.map(dept => dept.id);

        // Check for intersection
        const hasCommonDepartment = userDepartmentIds.some(userDeptId => 
            taskDepartmentIds.includes(userDeptId)
        );

        if (hasCommonDepartment) {
            console.log(`Permission granted: User ${userId} belongs to an assigned department.`);
            return true;
        }
         console.log(`Permission check: User ${userId}'s departments do not overlap with assigned departments.`);
    } else {
         console.log(`Permission check: Task ${taskId} has no assigned departments.`);
    }

    // 4. If neither direct user nor department match, deny permission
    console.log(`Permission denied for user ${userId} on task ${taskId}.`);
    return false;
  }

  async update(id: string, updateTaskDto: UpdateTaskDto, reqUser: any): Promise<Task> {
    const task = await this.findOne(id); // Fetch task with relations

    // --- Permission Check: Creator Only ---
    if (task.createdById !== reqUser.userId) {
      console.error(`Update failed: User ${reqUser.userId} is not the creator of task ${id}.`);
      throw new ForbiddenException('You do not have permission to update this task.');
    }
    console.log(`Update permission granted for user ${reqUser.userId} on task ${id}.`);
    // --- End Permission Check ---

    // Prevent updating fields that shouldn't be changed here (status, priority, type)
    const { status, priority, type, ...allowedUpdates } = updateTaskDto;
    if (status !== undefined || priority !== undefined || type !== undefined) {
        console.warn(`Update request for task ${id} contained restricted fields (status, priority, type) which were ignored.`);
    }

    // Handle assignee updates - Creator is allowed to change these
    let updatedUsers: User[] | undefined = undefined;
    if (allowedUpdates.assignedToUserIds) {
        if (task.type !== TaskType.USER && task.type !== TaskType.PERSONAL) {
             throw new BadRequestException(`Cannot assign users directly to a task of type ${task.type}.`);
        }
        updatedUsers = await this.usersRepository.findBy({ id: In(allowedUpdates.assignedToUserIds) });
        if (updatedUsers.length !== allowedUpdates.assignedToUserIds.length) {
            throw new BadRequestException('One or more assigned users not found.');
        }
    }

    let updatedDepartments: Department[] | undefined = undefined;
    if (allowedUpdates.assignedToDepartmentIds) {
         if (task.type !== TaskType.DEPARTMENT && task.type !== TaskType.PROVINCE_DEPARTMENT) {
             throw new BadRequestException(`Cannot assign departments directly to a task of type ${task.type}.`);
         }
        updatedDepartments = await this.departmentsRepository.findBy({ id: In(allowedUpdates.assignedToDepartmentIds) });
        if (updatedDepartments.length !== allowedUpdates.assignedToDepartmentIds.length) {
            throw new BadRequestException('One or more assigned departments not found.');
        }
        // Additional validation if province is involved
        if (task.type === TaskType.PROVINCE_DEPARTMENT || allowedUpdates.assignedToProvinceId) {
            const provinceId = allowedUpdates.assignedToProvinceId ?? task.assignedToProvinceId;
            if (!provinceId) throw new BadRequestException('Province ID is required for province-department tasks.');
            // Fetch province to ensure it exists
            const province = await this.provincesRepository.findOneBy({ id: provinceId });
            if (!province) throw new BadRequestException(`Province with ID ${provinceId} not found.`);
            // Validate departments belong to province
            const invalidDepts = updatedDepartments.filter(dept => dept.provinceId !== provinceId);
             if (invalidDepts.length > 0) {
                 throw new BadRequestException(`Departments [${invalidDepts.map(d => d.id).join(', ')}] do not belong to province ${provinceId}.`);
             }
        }
    }

     // Validate province ID update
     if (allowedUpdates.assignedToProvinceId !== undefined) {
         if (task.type !== TaskType.PROVINCE_DEPARTMENT) {
             throw new BadRequestException(`Cannot assign a province ID directly to a task of type ${task.type}.`);
         }
         if (allowedUpdates.assignedToProvinceId === null) {
             // Clear province is allowed
         } else {
             // Ensure province exists
             const province = await this.provincesRepository.findOneBy({ id: allowedUpdates.assignedToProvinceId });
             if (!province) {
                 throw new BadRequestException(`Province with ID ${allowedUpdates.assignedToProvinceId} not found.`);
             }
             // Validate assigned departments belong to the new province (if departments are also being updated)
             const deptsToCheck = updatedDepartments ?? task.assignedToDepartments;
             const invalidDepts = deptsToCheck.filter(dept => dept.provinceId !== allowedUpdates.assignedToProvinceId);
             if (invalidDepts.length > 0) {
                 throw new BadRequestException(`Departments [${invalidDepts.map(d => d.id).join(', ')}] do not belong to the new province ${allowedUpdates.assignedToProvinceId}.`);
             }
         }
     }


    // Update allowed fields (excluding status, priority, type)
    Object.assign(task, allowedUpdates);

    // Apply validated relations if they were provided
    if (updatedUsers !== undefined) task.assignedToUsers = updatedUsers;
    if (updatedDepartments !== undefined) task.assignedToDepartments = updatedDepartments;
    // Province ID is handled by Object.assign if included in allowedUpdates

    console.log(`Saving updated task ${id}...`);
    const updatedTask = await this.tasksRepository.save(task);

    // Log activity using createLog (requires fetching user object)
    try {
      const userObj = await this.usersRepository.findOneBy({ id: reqUser.userId });
      await this.activityLogService.createLog({
        user_id: reqUser.userId,
        action: 'update', 
        target: 'task', 
        details: `Updated task: ${updatedTask.title}`, 
        target_id: updatedTask.id,
        // ip_address: reqUser.ip // Pass IP if available
      });
    } catch (logError) {
      console.error(`Failed to log task update activity: ${logError.message}`);
    }

    return this.findOne(updatedTask.id); // Return reloaded task
  }

  async updateStatus(id: string, updateTaskStatusDto: UpdateTaskStatusDto, reqUser: any): Promise<Task> {
    const task = await this.findOne(id); // Fetch task with relations

    // --- Permission Check: Admin OR Creator OR Assignee (Direct/Department) ---
    let canUpdate = false;
    // 1. Check Admin role
    if (reqUser.role && reqUser.role === UserRole.ADMIN) {
      console.log(`Status Update permission granted: User ${reqUser.userId} is an Admin.`);
      canUpdate = true;
    }

    // 2. Check if user is the creator
    if (!canUpdate && task.createdById === reqUser.userId) {
      console.log(`Status Update permission granted: User ${reqUser.userId} is the creator.`);
      canUpdate = true;
    }

    // 3. Check if user is an assignee (direct user or via department)
    if (!canUpdate) {
      const isAssignee = await this.checkAssigneePermission(id, reqUser.userId);
      if (isAssignee) {
        console.log(`Status Update permission granted: User ${reqUser.userId} is an assignee (direct or department).`);
        canUpdate = true;
      } else {
        // Log only if none of the above conditions were met
         console.log(`Status Update permission check failed: User ${reqUser.userId} is not Admin, Creator, or Assignee for task ${id}.`);
      }
    }

    // Throw error if none of the checks passed
    if (!canUpdate) {
      console.error(`Status Update failed: User ${reqUser.userId} lacks permission for task ${id}.`);
      throw new ForbiddenException('You do not have permission to update the status of this task.');
    }
    // --- End Permission Check ---

    // --- Revised Status Transition Logic ---
    const currentStatus = task.status;
    const newStatus = updateTaskStatusDto.status;

    // Prevent changing status if already Completed or Cancelled
    if (currentStatus === TaskStatus.COMPLETED || currentStatus === TaskStatus.CANCELLED) {
        throw new BadRequestException(`Task is already ${currentStatus} and its status cannot be changed.`);
    }

    // Validate the target status itself is a valid enum value
    if (!Object.values(TaskStatus).includes(newStatus)) {
        throw new BadRequestException(`Invalid target status provided: ${newStatus}`);
    }
    
    // Allow setting to Pending, In Progress, or Completed if not already in a final state
    // (Removed the strict step-by-step validation)
    console.log(`Attempting to move task ${id} from ${currentStatus} to ${newStatus}`);
    // --- End Revised Logic ---

    task.status = newStatus;
    console.log(`Saving updated status (${newStatus}) for task ${id}...`);
    const updatedTask = await this.tasksRepository.save(task);

    // Log activity
    try {
        const userObj = await this.usersRepository.findOneBy({ id: reqUser.userId });
        await this.activityLogService.createLog({
            user_id: reqUser.userId,
            action: 'update_status',
            target: 'task',
            details: `Updated status of task "${updatedTask.title}" to ${newStatus}`,
            target_id: updatedTask.id
        });
    } catch (logError) {
      console.error(`Failed to log task status update activity: ${logError.message}`);
    }

    return updatedTask;
  }

  async updatePriority(id: string, updateTaskPriorityDto: UpdateTaskPriorityDto, reqUser: any): Promise<Task> {
    const task = await this.findOne(id); // Fetch task with relations

    // --- Permission Check: Assignee Only ---
    const canUpdate = await this.checkAssigneePermission(id, reqUser.userId);
    if (!canUpdate) {
      console.error(`Priority Update failed: User ${reqUser.userId} is not an assignee for task ${id}.`);
      throw new ForbiddenException('You do not have permission to update the priority of this task.');
    }
    console.log(`Priority Update permission granted for user ${reqUser.userId} on task ${id}.`);
    // --- End Permission Check ---

    task.priority = updateTaskPriorityDto.priority;
    console.log(`Saving updated priority (${task.priority}) for task ${id}...`);
    const updatedTask = await this.tasksRepository.save(task);

    // Log activity
    try {
        const userObj = await this.usersRepository.findOneBy({ id: reqUser.userId });
        await this.activityLogService.createLog({
            user_id: reqUser.userId,
            action: 'update_priority',
            target: 'task',
            details: `Updated priority of task "${updatedTask.title}" to ${task.priority}`,
            target_id: updatedTask.id
        });
    } catch (logError) {
      console.error(`Failed to log task priority update activity: ${logError.message}`);
    }

    return updatedTask;
  }

  async remove(id: string, reqUser: any): Promise<void> {
    const task = await this.findOne(id); // Fetch task to check creator and for logging

    // --- Permission Check: Creator Only ---
    if (task.createdById !== reqUser.userId) {
      console.error(`Delete failed: User ${reqUser.userId} is not the creator of task ${id}.`);
      throw new ForbiddenException('You do not have permission to delete this task.');
    }
    console.log(`Delete permission granted for user ${reqUser.userId} on task ${id}.`);
    // --- End Permission Check ---

    // Log activity before deletion
     try {
        const userObj = await this.usersRepository.findOneBy({ id: reqUser.userId });
        await this.activityLogService.createLog({
            user_id: reqUser.userId,
            action: 'delete',
            target: 'task',
            details: `Deleted task: ${task.title}`,
            target_id: task.id // Use task.id before it's deleted
        });
     } catch (logError) {
       console.error(`Failed to log task deletion activity: ${logError.message}`);
       // Decide if deletion should proceed if logging fails (likely yes)
     }

    console.log(`Attempting to delete task ${id}...`);
    const result = await this.tasksRepository.delete(id);

    if (result.affected === 0) {
      console.error(`Delete failed: Task with ID ${id} not found during delete operation.`);
      throw new NotFoundException(`Task with ID "${id}" could not be deleted (possibly already removed).`);
    }
     console.log(`Task ${id} deleted successfully.`);
  }

  async cancelTask(id: string, reqUser: any): Promise<Task> {
    const task = await this.findOne(id); // Fetch task with relations

    // --- Permission Check: Creator Only ---
    if (task.createdById !== reqUser.userId) {
        console.error(`Cancel failed: User ${reqUser.userId} is not the creator of task ${id}.`);
        throw new ForbiddenException('You do not have permission to cancel this task.');
    }
    console.log(`Cancel permission granted for user ${reqUser.userId} on task ${id}.`);
    // --- End Permission Check ---

    if (task.status === TaskStatus.COMPLETED || task.status === TaskStatus.CANCELLED) {
      throw new BadRequestException(`Cannot cancel a task that is already ${task.status}.`);
    }

    task.status = TaskStatus.CANCELLED;
    console.log(`Saving cancelled status for task ${id}...`);
    const updatedTask = await this.tasksRepository.save(task);

     // Log activity
     try {
        const userObj = await this.usersRepository.findOneBy({ id: reqUser.userId });
        await this.activityLogService.createLog({
            user_id: reqUser.userId,
            action: 'cancel',
            target: 'task',
            details: `Cancelled task: ${updatedTask.title}`,
            target_id: updatedTask.id
        });
     } catch (logError) {
       console.error(`Failed to log task cancellation activity: ${logError.message}`);
     }

    return updatedTask;
  }

  async delegateTask(id: string, dto: DelegateTaskDto, delegatorInfo: any): Promise<Task[]> {
    // 1. Find the original task
    const originalTask = await this.tasksRepository.findOne({ where: { id }, relations: ['assignedToUsers', 'assignedToDepartments', 'assignedToProvince', 'createdBy'] });
    if (!originalTask) {
      throw new NotFoundException(`Task with ID ${id} not found.`);
    }

    // 2. Permission check: Only the creator, assignee, or department head can delegate
    const isCreator = originalTask.createdById === delegatorInfo.userId;
    const isAssignee = originalTask.assignedToUsers?.some(u => u.id === delegatorInfo.userId);
    // TODO: Add department head check if needed
    if (!isCreator && !isAssignee) {
      throw new ForbiddenException('You do not have permission to delegate this task.');
    }

    // 3. For each new assignee, create a delegated task
    const delegatedTasks: Task[] = [];
    for (const userId of dto.newAssigneeUserIds) {
      // Find the user
      const user = await this.usersRepository.findOneBy({ id: userId });
      if (!user) {
        throw new NotFoundException(`User with ID ${userId} not found.`);
      }
      // Create the delegated task
      const delegatedTask = this.tasksRepository.create({
        title: originalTask.title,
        description: originalTask.description,
        priority: originalTask.priority,
        dueDate: originalTask.dueDate,
        type: originalTask.type,
        status: TaskStatus.PENDING,
        createdById: delegatorInfo.userId,
        assignedToUsers: [user],
        assignedToDepartments: originalTask.assignedToDepartments,
        assignedToProvinceId: originalTask.assignedToProvinceId,
        isDelegated: true,
        delegatedByUserId: delegatorInfo.userId,
        delegatedFromTaskId: originalTask.id,
        // Optionally, store delegationReason in a custom field or activity log
      });
      await this.tasksRepository.save(delegatedTask);
      delegatedTasks.push(delegatedTask);
    }
    // Optionally, log the delegation reason/activity
    // await this.activityLogService.logDelegation(...)
    return delegatedTasks;
  }

  async assignTask(id: string, userId: string, user: any): Promise<Task> {
    const task = await this.findOne(id);
    
    // Permissions Check: Only creator can assign/reassign?
    if (task.createdById !== user.userId) {
       throw new ForbiddenException('Only the task creator can assign users.');
    }

    const userToAssign = await this.usersRepository.findOne({where: {id: userId}});
    if (!userToAssign) throw new NotFoundException('User to assign not found');
    
    if (!task.assignedToUsers) task.assignedToUsers = [];
    if (!task.assignedToUsers.some(u => u.id === userId)) {
        task.assignedToUsers.push(userToAssign);
        return this.tasksRepository.save(task);
    }
    return task; // Return task if user already assigned
  }

  // START: Implement Dashboard Task Fetching
  async getDashboardTasks(user: any): Promise<any> {
    const userId = user.userId;
    console.log(`[TasksService] Fetching dashboard tasks for user ID: ${userId}`);

    try {
      // Fetch the current user with their department memberships
      const userWithDepartments = await this.usersRepository.findOne({
          where: { id: userId },
          relations: ['departments'] // Load the departments relation
      });

      let departmentIds: string[] = [];
      if (userWithDepartments && userWithDepartments.departments && userWithDepartments.departments.length > 0) {
          departmentIds = userWithDepartments.departments.map(dept => dept.id);
          console.log(`[TasksService] User ${userId} belongs to departments: ${departmentIds.join(', ')}`);
      } else {
          console.log(`[TasksService] User ${userId} does not belong to any departments.`);
      }

      // --- Fetch different task categories ---

      // 1. Tasks directly assigned to the user
      const directlyAssignedTasks = await this.getTasksAssignedToUser(userId);

      // 2. Tasks created by the user
      const createdTasks = await this.getTasksCreatedByUser(userId);

      // 3. Tasks delegated BY the user
      const delegatedByTasks = await this.getTasksDelegatedByUser(userId);

      // 4. Tasks delegated TO the user
      const delegatedToTasks = await this.getTasksDelegatedToUser(userId);

      // 5. Tasks assigned to the user's departments (if any)
      let departmentTasks: Task[] = [];
      if (departmentIds.length > 0) {
        departmentTasks = await this.getTasksForDepartments(departmentIds);
      }

      // --- Categorize tasks --- 

      // Helper to check if a task is in a list by ID
      const isInList = (task: Task, list: Task[]) => list.some(item => item.id === task.id);

      // Start with broad categories and refine
      const myPersonalTasks = createdTasks.filter(task =>
          task.type === TaskType.PERSONAL ||
          (task.type === TaskType.USER && isInList(task, directlyAssignedTasks) && task.assignedToUsers?.length === 1) // Only assigned to self
      );

      const tasksICreatedForOthers = createdTasks.filter(task =>
          !isInList(task, myPersonalTasks) // Exclude personal tasks already categorized
      );

      // Tasks purely assigned to me (not created by me, not personal)
      const tasksAssignedToMe = directlyAssignedTasks.filter(task =>
          task.createdById !== userId &&
          !isInList(task, myPersonalTasks) // Exclude personal tasks
      );

      // Tasks assigned to my departments (ensure they aren't already counted elsewhere)
      const tasksAssignedToMyDepartments = departmentTasks.filter(task =>
          task.createdById !== userId && // Not created by me
          !isInList(task, directlyAssignedTasks) // Not directly assigned to me
          // Consider if department tasks assigned *by* me should be excluded? Depends on requirements.
      );

      const tasksDelegatedByMe = delegatedByTasks;
      const tasksDelegatedToMe = delegatedToTasks;

      const response = {
        myPersonalTasks,
        tasksICreatedForOthers,
        tasksAssignedToMe,
        tasksAssignedToMyDepartments, // Added new category
        tasksDelegatedByMe,
        tasksDelegatedToMe,
      };

      console.log(`[TasksService] Dashboard data lengths: Personal=${response.myPersonalTasks.length}, Created=${response.tasksICreatedForOthers.length}, Assigned=${response.tasksAssignedToMe.length}, DeptTasks=${response.tasksAssignedToMyDepartments.length}, DelegatedBy=${response.tasksDelegatedByMe.length}, DelegatedTo=${response.tasksDelegatedToMe.length}`);

      return response;

    } catch (error) {
      console.error(`[TasksService] Error fetching dashboard tasks for user ${userId}:`, error);
      throw new Error(`Failed to retrieve dashboard tasks: ${error.message}`);
    }
  }

  // --- Helper methods used by getDashboardTasks --- (Existing ones: getTasksAssignedToUser, getTasksCreatedByUser, etc.)

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
      return await this.tasksRepository.find({
        where: {
            assignedToUsers: { id: userId },
            isDelegated: false // Only non-delegated tasks assigned directly
        },
        relations: ['createdBy', 'assignedToUsers', 'assignedToDepartments', 'assignedToProvince', 'delegatedBy'],
        order: { createdAt: 'DESC' }
      });
    } catch (error) {
      console.error(`Error fetching tasks assigned to user ${userId}:`, error);
      throw new Error(`Failed to fetch assigned tasks: ${error.message}`);
    }
  }

  async getTasksCreatedByUser(userId: string): Promise<Task[]> {
    console.log(`Fetching tasks created by user ${userId}`);
    try {
      return await this.tasksRepository.find({
        where: { createdById: userId, isDelegated: false }, // Exclude delegated tasks technically 'created' by original user
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
      // This returns the *new* delegated tasks created by this user's delegation action
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
      return await this.tasksRepository.find({
        where: {
            assignedToUsers: { id: userId },
            isDelegated: true // Only include delegated tasks
        },
        relations: ['createdBy', 'assignedToUsers', 'assignedToDepartments', 'assignedToProvince', 'delegatedBy', 'delegatedFromTask'],
        order: { createdAt: 'DESC' }
      });
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
}
