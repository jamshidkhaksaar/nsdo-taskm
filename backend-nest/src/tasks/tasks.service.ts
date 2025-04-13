import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
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
        .leftJoinAndSelect('task.department', 'department');

      if (query.departmentId) {
        queryBuilder = queryBuilder.andWhere('task.departmentId = :departmentId', { departmentId: query.departmentId });
      }

      if (query.status) {
        queryBuilder = queryBuilder.andWhere('task.status = :status', { status: query.status });
      }

      if (query.context) {
        queryBuilder = queryBuilder.andWhere('task.context = :context', { context: query.context });
      }

      const includeAll = query.include_all === 'true' || query.include_all === true;

      if (user.role === UserRole.MANAGER || user.role === UserRole.GENERAL_MANAGER) {
        if (query.task_type === 'my_tasks' && !includeAll) {
          queryBuilder = queryBuilder.andWhere('task.createdById = :userId', { userId: user.userId });
        } else if (query.task_type === 'assigned' && !includeAll) {
          queryBuilder = queryBuilder.andWhere('task.id IN (SELECT task_id FROM task_assignees WHERE user_id = :userId)', { userId: user.userId });
        }
      } else if (user.role === UserRole.ADMIN) {
        // Admins can see everything but typically use admin panel
        // No additional filters needed
      } else {
        if (query.task_type === 'my_tasks') {
          queryBuilder = queryBuilder.andWhere('task.createdById = :userId', { userId: user.userId });
        } else if (query.task_type === 'assigned') {
          queryBuilder = queryBuilder.andWhere('task.id IN (SELECT task_id FROM task_assignees WHERE user_id = :userId)', { userId: user.userId });
        } else {
          queryBuilder = queryBuilder.andWhere(
            '(task.createdById = :userId OR task.id IN (SELECT task_id FROM task_assignees WHERE user_id = :userId))',
            { userId: user.userId }
          );
        }
      }

      const tasks = await queryBuilder.getMany();
      console.log(`Found ${tasks.length} tasks with relations loaded`);
      return tasks;
    } catch (error) {
      console.error('Error finding tasks:', error);
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
        user: userObj ?? undefined,
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

    // --- Permission Check: Assignee Only ---
    const canUpdate = await this.checkAssigneePermission(id, reqUser.userId);
    if (!canUpdate) {
      console.error(`Status Update failed: User ${reqUser.userId} is not an assignee for task ${id}.`);
      throw new ForbiddenException('You do not have permission to update the status of this task.');
    }
     console.log(`Status Update permission granted for user ${reqUser.userId} on task ${id}.`);
    // --- End Permission Check ---

    // Validate allowed status transitions for Assignee
    const currentStatus = task.status;
    const newStatus = updateTaskStatusDto.status;
    
    if (currentStatus === TaskStatus.PENDING && newStatus !== TaskStatus.IN_PROGRESS) {
         throw new BadRequestException('Assignee can only change status from Pending to In Progress.');
    }
     if (currentStatus === TaskStatus.IN_PROGRESS && newStatus !== TaskStatus.COMPLETED) {
         throw new BadRequestException('Assignee can only change status from In Progress to Completed.');
    }
     if (currentStatus === TaskStatus.COMPLETED || currentStatus === TaskStatus.CANCELLED) {
          throw new BadRequestException(`Task is already ${currentStatus} and cannot be changed by assignee.`);
     }
     // Ensure the target status is valid for assignee actions
     if (newStatus !== TaskStatus.IN_PROGRESS && newStatus !== TaskStatus.COMPLETED) {
          throw new BadRequestException(`Invalid target status for assignee action: ${newStatus}`);
     }

    task.status = newStatus;
    console.log(`Saving updated status (${newStatus}) for task ${id}...`);
    const updatedTask = await this.tasksRepository.save(task);

    // Log activity
    try {
        const userObj = await this.usersRepository.findOneBy({ id: reqUser.userId });
        await this.activityLogService.createLog({
            user: userObj ?? undefined,
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
            user: userObj ?? undefined,
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
            user: userObj ?? undefined,
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
            user: userObj ?? undefined,
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

  async delegateTask(id: string, userIds: string[], delegatorInfo: any): Promise<Task> {
    console.log(`Attempting to delegate task ${id} to users ${userIds.join(', ')} by delegator:`, JSON.stringify(delegatorInfo, null, 2));

    if (!userIds || userIds.length === 0) {
        throw new BadRequestException('At least one user ID must be provided for delegation.');
    }

    try {
        // Fetch the original task with necessary relations for permission checks
        const originalTask = await this.tasksRepository.findOne({
            where: { id },
            relations: [
                'createdBy',
                'assignedToUsers',
                'assignedToDepartments', // Ensure departments are loaded
            ],
        });

        if (!originalTask) {
            console.error(`Delegation failed: Original task with ID ${id} not found.`);
            throw new NotFoundException(`Task with ID "${id}" not found`);
        }
        console.log(`Original task found: ${originalTask.title}, Type: ${originalTask.type}`);

        // Fetch the full delegator user entity
        const delegator = await this.usersService.findById(delegatorInfo.userId);
        if (!delegator) {
             console.error(`Delegation failed: Delegator user with ID ${delegatorInfo.userId} not found.`);
            throw new NotFoundException(`Delegator user with ID ${delegatorInfo.userId} not found.`);
        }
        console.log(`Delegator user found: ${delegator.username}, Role: ${delegator.role}`);

        // --- Permission Check ---
        const isCreator = originalTask.createdById === delegator.id;
        const isDirectAssignee = originalTask.assignedToUsers.some(user => user.id === delegator.id);

        let isDepartmentHeadDelegating = false;
        let isAllowedToDelegate = isCreator || isDirectAssignee;

        // Check if the delegator is a department head and the task is assigned to their department
        if (!isAllowedToDelegate && (delegator.role === UserRole.MANAGER || delegator.role === UserRole.GENERAL_MANAGER)) {
            console.log(`Checking if delegator ${delegator.username} is a head of assigned departments...`);
            if (originalTask.type === TaskType.DEPARTMENT || originalTask.type === TaskType.PROVINCE_DEPARTMENT) {
                const assignedDeptIds = originalTask.assignedToDepartments.map(dept => dept.id);
                console.log(`Task assigned to departments: ${assignedDeptIds.join(', ')}`);
                // Find departments where the delegator is the head AND the task is assigned to it
                const headOfAssignedDepts = await this.departmentsRepository.count({
                     where: {
                         id: In(assignedDeptIds),
                         headId: delegator.id, // Check if delegator is the head
                     },
                 });

                 if (headOfAssignedDepts > 0) {
                     isDepartmentHeadDelegating = true;
                     isAllowedToDelegate = true; // Grant permission
                     console.log(`Delegator ${delegator.username} is head of ${headOfAssignedDepts} department(s) this task is assigned to. Granting delegation permission.`);
                 } else {
                     console.log(`Delegator ${delegator.username} is not a head of any department this task is assigned to.`);
                 }
            } else {
                 console.log(`Delegation as Department Head not applicable for task type ${originalTask.type}.`);
            }
        }

        if (!isAllowedToDelegate) {
            console.error(`Delegation failed: User ${delegator.username} (${delegator.id}) does not have permission to delegate task ${id}.`);
            throw new ForbiddenException('You do not have permission to delegate this task.');
        }
        // --- End Permission Check ---


        // --- Validate Target Users ---
        const targetUsers = await this.usersRepository.find({
            where: { id: In(userIds) },
            relations: ['department'], // Load department relation for validation
        });

        if (targetUsers.length !== userIds.length) {
            const foundIds = targetUsers.map(u => u.id);
            const notFoundIds = userIds.filter(id => !foundIds.includes(id));
            console.error(`Delegation failed: One or more target users not found: ${notFoundIds.join(', ')}`);
            throw new BadRequestException(`One or more target users not found: ${notFoundIds.join(', ')}`);
        }
        console.log(`Found ${targetUsers.length} target users for delegation.`);

        // Additional validation if a Department Head is delegating
        if (isDepartmentHeadDelegating) {
            console.log(`Validating target users for Department Head delegation...`);
            const taskAssignedDeptIds = originalTask.assignedToDepartments.map(dept => dept.id);
            // Find the departments the delegator is head of *among those the task is assigned to*
            const delegatorHeadOfDepts = await this.departmentsRepository.find({
                 where: {
                     id: In(taskAssignedDeptIds),
                     headId: delegator.id,
                 },
                 select: ['id']
            });
            const delegatorHeadOfDeptIds = delegatorHeadOfDepts.map(d => d.id);
            console.log(`Delegator is head of these assigned departments: ${delegatorHeadOfDeptIds.join(', ')}`);


            const invalidUsers = targetUsers.filter(targetUser => {
                // A target user is valid if their department ID is one of the departments
                // the task is assigned to AND the delegator is the head of.
                return !(targetUser.departmentId && delegatorHeadOfDeptIds.includes(targetUser.departmentId));
            });

            if (invalidUsers.length > 0) {
                const invalidUsernames = invalidUsers.map(u => u.username).join(', ');
                console.error(`Delegation failed: Department Head ${delegator.username} can only delegate to users within the assigned departments they manage. Invalid users: ${invalidUsernames}`);
                throw new ForbiddenException(`You can only delegate this task to users within the department(s) you manage and to which this task is assigned. Invalid users: ${invalidUsernames}`);
            }
             console.log(`All target users are valid members for Department Head delegation.`);
        }
        // --- End Validate Target Users ---


        console.log(`Proceeding to create delegated tasks for task ${id}...`);
        const delegatedTasks: Task[] = [];

        for (const targetUser of targetUsers) {
            const delegatedTask = new Task();
            // Copy relevant details from the original task
            delegatedTask.title = `(Delegated) ${originalTask.title}`;
            delegatedTask.description = originalTask.description;
            delegatedTask.priority = originalTask.priority;
            delegatedTask.dueDate = originalTask.dueDate;
            delegatedTask.type = TaskType.USER; // Delegated tasks are always assigned to specific users
            delegatedTask.status = TaskStatus.PENDING; // Start as pending
            // Link back to original task and delegator
            delegatedTask.isDelegated = true;
            delegatedTask.delegatedFromTaskId = originalTask.id;
            delegatedTask.delegatedByUserId = delegator.id;
            // Assign to the target user
            delegatedTask.assignedToUsers = [targetUser];
            // Set the creator as the delegator (or should it be the original creator? TBD - using delegator for now)
            delegatedTask.createdById = delegator.id; // Delegator becomes the creator of the delegated task

            console.log(`Creating delegated task for user ${targetUser.username} (ID: ${targetUser.id}).`);
            const savedDelegatedTask = await this.tasksRepository.save(delegatedTask);
            delegatedTasks.push(savedDelegatedTask);
            console.log(`Saved delegated task with ID: ${savedDelegatedTask.id}`);

            // Log activity for each delegated task creation
            try {
                await this.activityLogService.logManual(
                  delegatorInfo.userId,
                  'delegate',
                  'task',
                  `Delegated task "${originalTask.title}" to user ${targetUser.username}`,
                  originalTask.id, // Log against the original task ID
                  { delegatedToUserId: targetUser.id, delegatedTaskId: savedDelegatedTask.id } // Add context
                );
            } catch (logError) {
                console.error(`Failed to log task delegation activity: ${logError.message}`);
            }
        }

        console.log(`Successfully created ${delegatedTasks.length} delegated tasks.`);
        // Return the original task (or perhaps the list of delegated tasks? Returning original for now)
        // Reload original task to reflect any potential changes (though none are made here directly)
        return this.findOne(originalTask.id);

    } catch (error) {
        console.error(`Error during task delegation for task ${id}:`, error);
        if (error instanceof BadRequestException || error instanceof NotFoundException || error instanceof ForbiddenException) {
            throw error;
        }
        throw new BadRequestException(`Failed to delegate task: ${error.message || 'Unknown error'}`);
    }
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
    console.log(`Fetching dashboard tasks for user ${userId}`);

    try {
      // Fetch tasks created by the user
      const createdByMe = await this.tasksRepository.find({
        where: { createdById: userId, isDelegated: false }, // Exclude tasks created *as* delegation
        relations: ['assignedToUsers', 'assignedToDepartments', 'assignedToProvince', 'delegatedBy', 'createdBy'],
        order: { createdAt: 'DESC' }
      });

      // Fetch tasks assigned directly to the user (not via delegation)
      const assignedToMeDirectly = await this.tasksRepository.find({
        where: {
            assignedToUsers: { id: userId },
            isDelegated: false, // Exclude delegated tasks assigned to me
            createdById: In(userId ? [] : [userId]) // Exclude tasks I created for myself (already in createdByMe)
        },
        relations: ['createdBy', 'assignedToUsers', 'assignedToDepartments', 'assignedToProvince', 'delegatedBy'],
        order: { createdAt: 'DESC' }
      });

      // Fetch tasks delegated *by* the user (find the original tasks they delegated)
      // Note: This fetches the *delegated* tasks, frontend might need original task details
      const delegatedByMe = await this.tasksRepository.find({
        where: { delegatedByUserId: userId, isDelegated: true },
        relations: ['createdBy', 'assignedToUsers', 'assignedToDepartments', 'assignedToProvince', 'delegatedBy', 'delegatedFromTask'],
        order: { createdAt: 'DESC' }
      });

      // Fetch tasks delegated *to* the user
      const delegatedToMe = await this.tasksRepository.find({
        where: {
            assignedToUsers: { id: userId },
            isDelegated: true // Only include delegated tasks
        },
        relations: ['createdBy', 'assignedToUsers', 'assignedToDepartments', 'assignedToProvince', 'delegatedBy', 'delegatedFromTask'],
        order: { createdAt: 'DESC' }
      });

      // Separate Personal tasks from CreatedByMe
      const myPersonalTasks = createdByMe.filter(task => 
        task.type === TaskType.PERSONAL && task.assignedToUsers?.some(u => u.id === userId)
      );
      const tasksICreatedForOthers = createdByMe.filter(task => task.type !== TaskType.PERSONAL);
      
      console.log(`Dashboard tasks for user ${userId}: Personal=${myPersonalTasks.length}, Created=${tasksICreatedForOthers.length}, Assigned=${assignedToMeDirectly.length}, DelegatedBy=${delegatedByMe.length}, DelegatedTo=${delegatedToMe.length}`);

      // Log activity
      try {
        const userObj = await this.usersRepository.findOneBy({ id: userId });
        await this.activityLogService.createLog({
            user: userObj ?? undefined,
            action: 'view',
            target: 'dashboard_tasks',
            details: `User viewed their task dashboard.`,
            status: 'success',
            ip_address: 'unknown' // IP typically not available in service layer
        });
      } catch (logError) {
        console.error(`Failed to log dashboard view activity: ${logError.message}`);
      }

      return {
        myPersonalTasks,         // Personal tasks created by the user for themselves
        tasksICreatedForOthers, // Tasks created by the user assigned to others/departments/provinces
        tasksAssignedToMe: assignedToMeDirectly, // Tasks directly assigned to the user (non-delegated)
        tasksDelegatedByMe: delegatedByMe,       // Tasks the user has delegated to others
        tasksDelegatedToMe: delegatedToMe         // Tasks delegated to the user
      };

    } catch (error) {
      console.error(`Error fetching dashboard tasks for user ${userId}:`, error);
      throw new Error(`Failed to fetch dashboard tasks: ${error.message}`);
    }
  }
  // END: Implement Dashboard Task Fetching

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
