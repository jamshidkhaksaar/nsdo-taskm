import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  InternalServerErrorException,
  Logger,
  forwardRef,
  Inject,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository, Not } from "typeorm";
import {
  Task,
  TaskStatus,
  TaskPriority,
  TaskType,
  DelegationRequestStatus,
} from "./entities/task.entity";
import { CreateTaskDto } from "./dto/create-task.dto";
import { UpdateTaskDto } from "./dto/update-task.dto";
import { User } from "../users/entities/user.entity";
import { Department } from "../departments/entities/department.entity";
import { Province } from "../provinces/entities/province.entity";
import { DepartmentsService } from "../departments/departments.service";
import { ActivityLogService } from "../admin/services/activity-log.service";
import { UpdateTaskStatusDto } from "./dto/update-task-status.dto";
import { UpdateTaskPriorityDto } from "./dto/update-task-priority.dto";
import { UsersService } from "../users/users.service";
import { ActivityLog } from "../admin/entities/activity-log.entity";
import { DelegateTaskDto } from "./dto/delegate-task.dto";
import { DeleteTaskDto } from "./dto/delete-task.dto";
import { RecycleBinQueryDto } from "./dto/recycle-bin-query.dto";
import { MailService } from "../mail/mail.service";
import { ConfigService } from "@nestjs/config";
import { TaskQueryService } from "./task-query.service";
import { UpdateTaskAssignmentsDto } from "./dto/update-task-assignments.dto";
import { UpdateDelegationStatusDto } from "./dto/update-delegation-status.dto";

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
  private readonly logger = new Logger(TasksService.name);

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
    private readonly mailService: MailService,
    private readonly configService: ConfigService,
    @Inject(forwardRef(() => TaskQueryService))
    private taskQueryService: TaskQueryService,
  ) {}

  async create(createTaskDto: CreateTaskDto, creatorId: string): Promise<Task> {
    this.logger.log(`Creating task with DTO: ${JSON.stringify(createTaskDto)}, Creator ID: ${creatorId}`);
    try {
      const task = new Task();
      task.title = createTaskDto.title;
      task.description = createTaskDto.description ?? '';
      task.priority = createTaskDto.priority || TaskPriority.MEDIUM;
      task.dueDate = createTaskDto.dueDate ? new Date(createTaskDto.dueDate) : null;
      task.createdById = creatorId;
      task.status = TaskStatus.PENDING;
      task.isDelegated = false;
      task.type = createTaskDto.type; // Use type from DTO

      task.assignedToUsers = [];
      task.assignedToDepartments = [];
      task.assignedToProvinceId = null; // Default to null, explicitly not used for PROVINCE_DEPARTMENT type

      const creatorUser = await this.usersRepository.findOneBy({ id: creatorId });
      if (!creatorUser) {
        throw new NotFoundException(`Creator user with ID ${creatorId} not found.`);
      }

      switch (createTaskDto.type) {
        case TaskType.PERSONAL:
          task.assignedToUsers = [creatorUser];
          this.logger.debug(`Task type set to PERSONAL, assigned to creator.`);
          break;

        case TaskType.USER:
          if (!createTaskDto.assignedToUserIds || createTaskDto.assignedToUserIds.length === 0) {
            throw new BadRequestException("assignedToUserIds must be provided for TaskType.USER.");
          }
          if (createTaskDto.assignedToDepartmentIds || createTaskDto.assignedToProvinceId) {
            throw new BadRequestException("assignedToDepartmentIds or assignedToProvinceId should not be provided for TaskType.USER.");
          }
          const users = await this.usersRepository.findBy({ id: In(createTaskDto.assignedToUserIds) });
          if (users.length !== createTaskDto.assignedToUserIds.length) {
            const foundIds = users.map((u) => u.id);
            const notFoundIds = createTaskDto.assignedToUserIds.filter((id) => !foundIds.includes(id));
            throw new BadRequestException(`One or more assigned users not found: ${notFoundIds.join(", ")}`);
          }
          task.assignedToUsers = users;
          this.logger.debug(`Task type set to USER, assigned to ${task.assignedToUsers.length} users.`);
          break;

        case TaskType.DEPARTMENT:
          if (!createTaskDto.assignedToDepartmentIds || createTaskDto.assignedToDepartmentIds.length === 0) {
            throw new BadRequestException("assignedToDepartmentIds must be provided for TaskType.DEPARTMENT.");
          }
          if (createTaskDto.assignedToUserIds || createTaskDto.assignedToProvinceId) {
            throw new BadRequestException("assignedToUserIds or assignedToProvinceId should not be provided for TaskType.DEPARTMENT.");
          }
          const departmentsForDeptTask = await this.departmentsRepository.findBy({ id: In(createTaskDto.assignedToDepartmentIds) });
          if (departmentsForDeptTask.length !== createTaskDto.assignedToDepartmentIds.length) {
             const foundIds = departmentsForDeptTask.map((d) => d.id);
             const notFoundIds = createTaskDto.assignedToDepartmentIds.filter((id) => !foundIds.includes(id));
            throw new BadRequestException(`One or more assigned departments not found: ${notFoundIds.join(", ")}`);
          }
          task.assignedToDepartments = departmentsForDeptTask;
          this.logger.debug(`Task type set to DEPARTMENT, assigned to ${task.assignedToDepartments.length} departments.`);
          break;

        case TaskType.PROVINCE_DEPARTMENT:
          if (!createTaskDto.assignedToDepartmentIds || createTaskDto.assignedToDepartmentIds.length === 0) {
            throw new BadRequestException("assignedToDepartmentIds must be provided for TaskType.PROVINCE_DEPARTMENT.");
          }
          if (createTaskDto.assignedToUserIds) {
            throw new BadRequestException("assignedToUserIds should not be provided for TaskType.PROVINCE_DEPARTMENT.");
          }
          const departmentsForProvDeptTask = await this.departmentsRepository.find({
            where: { id: In(createTaskDto.assignedToDepartmentIds) },
            // relations: ["province"], // Province relation will be loaded for notifications if needed
          });
          if (departmentsForProvDeptTask.length !== createTaskDto.assignedToDepartmentIds.length) {
            const foundIds = departmentsForProvDeptTask.map((d) => d.id);
            const notFoundIds = createTaskDto.assignedToDepartmentIds.filter((id) => !foundIds.includes(id));
            throw new BadRequestException(`One or more assigned departments not found for provincial assignment: ${notFoundIds.join(", ")}`);
          }
          // Ensure all departments for PROVINCE_DEPARTMENT have a provinceId for consistent display later
          const deptsWithoutProvince = departmentsForProvDeptTask.filter(d => !d.provinceId);
          if (deptsWithoutProvince.length > 0) {
            this.logger.warn(`Departments [${deptsWithoutProvince.map(d => d.id).join(', ')}] are assigned to a PROVINCE_DEPARTMENT task but do not have a provinceId.`);
            // Depending on strictness, could throw BadRequestException here
          }
          task.assignedToDepartments = departmentsForProvDeptTask;
          this.logger.debug(`Task type set to PROVINCE_DEPARTMENT, assigned to ${task.assignedToDepartments.length} departments.`);
          break;

        default:
          // Ensure createTaskDto.type is a valid TaskType enum member
          // This should be caught by class-validator's IsEnum, but as a safeguard:
          if (!Object.values(TaskType).includes(createTaskDto.type as TaskType)) {
             throw new BadRequestException(`Invalid task type provided: ${createTaskDto.type}`);
          }
          throw new BadRequestException(`Unsupported task type logic: ${createTaskDto.type}`);
      }

      this.logger.debug("Task object before save:", JSON.stringify(task));
      const savedTask = await this.tasksRepository.save(task);
      this.logger.log("Task saved successfully with ID:", savedTask.id);

      // Reload task with relations for notifications and activity logging
      const taskWithRelationsForNotification = await this.tasksRepository.findOne({
        where: { id: savedTask.id },
        relations: [
          "createdBy", // User object for creator
          "assignedToUsers", // User objects for direct assignees
          "assignedToDepartments", // Department objects
          "assignedToDepartments.province", // Province object for each assigned department
        ],
      });

      if (taskWithRelationsForNotification) {
        await this.sendCreationNotifications(taskWithRelationsForNotification, creatorUser);
        await this.activityLogService.createLog({
          user_id: creatorId,
          action: "CREATE_TASK",
          target: "Task",
          target_id: savedTask.id,
          details: `Created task: ${savedTask.title} (Type: ${savedTask.type})`,
        });
      } else {
        this.logger.error(`Failed to reload task ${savedTask.id} with relations for notifications and activity log.`);
      }

      return savedTask; // Return the initial saved task (without all relations if not reloaded, or taskWithRelationsForNotification)
                      // For consistency, might be better to return taskWithRelationsForNotification if available, else savedTask
    } catch (error) {
      this.logger.error(`Error creating task: ${error.message}`, error.stack);
      if (error instanceof BadRequestException || error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      // Ensure a generic error is thrown for other cases to avoid leaking sensitive info
      throw new InternalServerErrorException(`An unexpected error occurred while creating the task.`);
    }
  }

  private async sendCreationNotifications(task: Task, creator: User) {
    const frontendUrl = this.configService.get<string>("FRONTEND_URL") || "http://localhost:5173";
    const taskLink = `${frontendUrl}/tasks/${task.id}`; // Adjust path if needed
    const creatorName = creator.username || "System";

    // Notify users if directly assigned (TaskType.USER)
    if (task.type === TaskType.USER && task.assignedToUsers) {
      for (const assignedUser of task.assignedToUsers) {
        if (assignedUser.id !== creator.id) { // Don't notify creator if they assigned to themselves
          this.logger.debug(`Sending TASK_ASSIGNED_USER email to ${assignedUser.email} for task ${task.id}`);
          // Assuming mailService.sendTaskAssignedEmail exists and is typed
          await this.mailService.sendTaskAssignedEmail(assignedUser, task, creator, taskLink);
          // TODO: Add in-app notification for assignedUser.id
        }
      }
    }
    // Notify members of assigned departments (TaskType.DEPARTMENT or TaskType.PROVINCE_DEPARTMENT)
    else if ((task.type === TaskType.DEPARTMENT || task.type === TaskType.PROVINCE_DEPARTMENT) && task.assignedToDepartments) {
      // Construct a display string for all assigned departments and their provinces (if applicable)
      const departmentDetailsForEmail = task.assignedToDepartments.map(dept => {
        let detail = dept.name;
        // For PROVINCE_DEPARTMENT tasks, ensure province is loaded and add its name
        if (task.type === TaskType.PROVINCE_DEPARTMENT && dept.province && dept.province.name) {
          detail += ` (${dept.province.name})`;
        } else if (task.type === TaskType.PROVINCE_DEPARTMENT && !dept.province) {
          // Fallback if province relation wasn't loaded, though relations in create method should handle this
          detail += ` (Province ID: ${dept.provinceId || 'N/A'})`;
        }
        return detail;
      }).join(", ");

      const userIdsToNotify = new Set<string>();
      for (const dept of task.assignedToDepartments) {
        // Fetch members for each department
        const departmentWithMembers = await this.departmentsRepository.findOne({
            where: { id: dept.id }, 
            relations: ["members"] // Ensure 'members' relation is loaded
        });
        if (departmentWithMembers && departmentWithMembers.members) {
          departmentWithMembers.members.forEach(member => {
            if (member.id !== creator.id) { // Don't notify creator if they are part of the department
                userIdsToNotify.add(member.id);
            }
          });
        }
      }
      
      if (userIdsToNotify.size > 0) {
        const usersToActuallyNotify = await this.usersRepository.findBy({ id: In(Array.from(userIdsToNotify)) });
        for (const member of usersToActuallyNotify) {
          this.logger.debug(`Sending TASK_ASSIGNED_TO_DEPARTMENT_EMAIL email to ${member.email} for task ${task.id} (Departments: ${departmentDetailsForEmail})`);
          // Assuming mailService.sendTaskAssignedToDepartmentEmail exists
          await this.mailService.sendTaskAssignedToDepartmentEmail(member, task, creator, taskLink, departmentDetailsForEmail);
          // TODO: Add in-app notification for member.id: "New task assigned to your department(s): ..."
        }
      }
    }

    // Optional: Send a confirmation to the creator for tasks they created for others
    if (task.type !== TaskType.PERSONAL && task.createdById === creator.id) {
      this.logger.debug(`Optionally sending TASK_CREATED_CONFIRMATION_EMAIL email to creator ${creator.email} for task ${task.id}`);
      // await this.mailService.sendTaskCreatedConfirmationEmail(creator, task, taskLink);
    }
  }

  async update(
    id: string,
    updateTaskDto: UpdateTaskDto,
    reqUser: any,
  ): Promise<Task> {
    // const task = await this.findOne(id); // Use Query Service
    const task = await this.taskQueryService.findOne(id);

    // --- Permission Check: REMOVED - Handled by PermissionsGuard ---
    // const isCreator = task.createdById === reqUser.userId;
    // const isAdminOrLeadership = this.rbacHelper.isAdminOrLeadership(reqUser); // Use helper
    // if (!isCreator && !isAdminOrLeadership) {
    //   throw new ForbiddenException(
    //     "Only the task creator, admin, or leadership can edit the task details.",
    //   );
    // }
    // --- End Permission Check ---

    // Store original state for logging
    // const originalTaskJson = JSON.stringify(task); <-- COMMENT OUT

    // Update allowed fields from DTO
    // IMPORTANT: Do not allow changing priority, status, or assignments via this general update endpoint.
    let changed = false;
    if (
      updateTaskDto.title !== undefined &&
      task.title !== updateTaskDto.title
    ) {
      task.title = updateTaskDto.title;
      changed = true;
    }
    if (
      updateTaskDto.description !== undefined &&
      task.description !== updateTaskDto.description
    ) {
      task.description = updateTaskDto.description;
      changed = true;
    }
    const newDueDate = updateTaskDto.dueDate
      ? new Date(updateTaskDto.dueDate)
      : null;
    const currentDueDate = task.dueDate;
    // Compare dates carefully
    if (
      (newDueDate === null && currentDueDate !== null) ||
      (newDueDate !== null && currentDueDate === null) ||
      (newDueDate &&
        currentDueDate &&
        newDueDate.getTime() !== currentDueDate.getTime())
    ) {
      task.dueDate = newDueDate;
      changed = true;
    }

    // Log changes if any occurred
    if (changed) {
      await this.activityLogService.createLog({
        user_id: reqUser.userId,
        action: "Task Details Updated",
        target: "Task",
        target_id: task.id,
        details: `Details for task "${task.title}" (ID: ${task.id}) were updated.`,
        status: "success",
      });
      const updatedTask = await this.tasksRepository.save(task);
      // return this.findOne(updatedTask.id); // Use Query Service
      return this.taskQueryService.findOne(updatedTask.id);
    } else {
      this.logger.log(`No changes detected for task ${id}. Skipping save.`);
      // return task; // Return original task if no changes
      return this.taskQueryService.findOne(task.id);
    }
  }

  async updateStatus(
    id: string,
    updateTaskStatusDto: UpdateTaskStatusDto,
    reqUser: any,
  ): Promise<Task> {
    const task = await this.taskQueryService.findOne(id);
    const { status, cancellationReason } = updateTaskStatusDto;
    const originalStatus = task.status;
    const originalAssignees = await this.getAssigneesForNotification(task);

    // Fetch the requesting user's full entity with departments for permission checks
    const requestingUserEntity = await this.usersService.findById(reqUser.userId, ["departments"]);
    if (!requestingUserEntity) {
      this.logger.error(`User ${reqUser.userId} performing action not found.`);
      throw new NotFoundException(`User ${reqUser.userId} not found.`);
    }

    if (originalStatus === status) {
      this.logger.warn(`Task ${id} is already in status ${status}. No update performed.`);
      // return task; // Return task unchanged
      return this.taskQueryService.findOne(task.id);
    }

    // --- Permission Check: Now uses PermissionsGuard, but internal checks can be more granular or serve as backup
    const isCreator = task.createdById === reqUser.userId;
    const isAssignee = await this.taskQueryService.checkAssigneePermission(
      task,
      reqUser.userId,
      requestingUserEntity, // Pass the fetched user entity
    );
    // const isAdminOrLeadership = this.rbacHelper.isAdminOrLeadership(requestingUserEntity); // Use helper with full entity
    // Simplified role check for example, RBAC guard should be primary
    const isAdminOrLeadership = ["ADMIN", "LEADERSHIP"].includes(requestingUserEntity.role?.name);

    // Perform status-specific logic (assuming permissions passed)
    if (status === TaskStatus.CANCELLED) {
      if (!cancellationReason || cancellationReason.length < 20) {
        throw new BadRequestException(
          "A detailed cancellation reason (at least 20 characters) is required",
        );
      }
      if (task.status === TaskStatus.COMPLETED) {
        throw new BadRequestException(
          `Cannot cancel a task that is already completed.`,
        );
      }
      task.cancelledAt = new Date();
      task.cancelledById = reqUser.userId;
      task.cancellationReason = cancellationReason;
    }
    // Additional validation for status transitions (still needed)
    if (originalStatus === TaskStatus.CANCELLED && status !== TaskStatus.CANCELLED) {
        // Logic to check if user can move *from* cancelled (e.g., based on creator/admin/leadership)
        // This part *might* still need role info if not handled by granular permissions yet.
        // For now, let's assume PermissionsGuard covers the intent.
        // Revisit if specific transitions fail.
        this.logger.warn(`Attempting to move task ${id} from CANCELLED status.`);
    }

    task.status = status;

    // If completing the task, set completedAt
    if (status === TaskStatus.COMPLETED) {
      task.completedAt = new Date();
    }

    // Add activity log entry
    await this.activityLogService.createLog({
      user_id: reqUser.userId,
      action: "Task Status Changed",
      target: "Task",
      target_id: task.id,
      details: `Status of task "${task.title}" (ID: ${task.id}) changed from ${originalStatus} to ${status}.${status === TaskStatus.CANCELLED ? ` Reason: ${cancellationReason}` : ""}`,
      status: "success",
    });

    const updatedTask = await this.tasksRepository.save(task);

    // --- Send Notifications for Status Change ---
    if ([TaskStatus.COMPLETED, TaskStatus.CANCELLED].includes(status)) {
      const frontendUrl =
        this.configService.get<string>("FRONTEND_URL") ||
        "http://localhost:5173";
      const taskLink = `${frontendUrl}/tasks/${updatedTask.id}`;
      const statusText =
        status === TaskStatus.COMPLETED ? "completed" : "cancelled";
      const message = `The status of task "${updatedTask.title}" has been updated to ${statusText}.`;

      for (const assignee of originalAssignees) {
        if (assignee.id === reqUser.userId) continue; // Don't notify the user who made the change

        try {
          // Temporarily disable notification publishing
          // await this.notificationsService.createAndPublishNotification({
          //     type: `TASK_STATUS_${status.toUpperCase()}`,
          //     message: message,
          //     userId: assignee.id,
          //     relatedEntityType: 'Task',
          //     relatedEntityId: updatedTask.id,
          // });
          this.logger.warn(
            `Notification publishing temporarily disabled for TASK_STATUS_${status.toUpperCase()} for user ${assignee.id}`,
          );
          // this.logger.log(`Task status change notification (${status}) published for user ${assignee.id}`);
        } catch (notificationError) {
          this.logger.error(
            `Failed to publish task status change notification for user ${assignee.id}: ${notificationError.message}`,
            notificationError.stack,
          );
        }
      }
    }
    // --- End Notifications ---
    // return this.findOne(updatedTask.id); // Use Query Service
    return this.taskQueryService.findOne(updatedTask.id);
  }

  async updatePriority(
    id: string,
    updateTaskPriorityDto: UpdateTaskPriorityDto,
    reqUser: any,
  ): Promise<Task> {
    const task = await this.taskQueryService.findOne(id);
    const { priority } = updateTaskPriorityDto;
    const originalPriority = task.priority;
    const originalAssignees = await this.getAssigneesForNotification(task);

    // Fetch the requesting user's full entity with departments for permission checks
    const requestingUserEntity = await this.usersService.findById(reqUser.userId, ["departments"]);
    if (!requestingUserEntity) {
      this.logger.error(`User ${reqUser.userId} performing action not found.`);
      throw new NotFoundException(`User ${reqUser.userId} not found.`);
    }

    if (originalPriority === priority) {
      this.logger.warn(`Task ${id} already has priority ${priority}. No update performed.`);
      // return task;
      return this.taskQueryService.findOne(task.id);
    }

    // --- Permission Check: REMOVED - Handled by PermissionsGuard ---
    const isCreator = task.createdById === reqUser.userId;
    const isAssignee = await this.taskQueryService.checkAssigneePermission(
      task,
      reqUser.userId,
      requestingUserEntity, // Pass the fetched user entity
    );
    // const isAdminOrLeadership = this.rbacHelper.isAdminOrLeadership(requestingUserEntity); // Use helper
    const isAdminOrLeadership = ["ADMIN", "LEADERSHIP"].includes(requestingUserEntity.role?.name);

    if (!isCreator && !isAssignee && !isAdminOrLeadership) {
      throw new ForbiddenException(
        "You do not have permission to change the priority of this task.",
      );
    }
    // --- End Permission Check ---

    task.priority = priority;

    // Add activity log entry
    await this.activityLogService.createLog({
      user_id: reqUser.userId,
      action: "Task Priority Changed",
      target: "Task",
      target_id: task.id,
      details: `Priority of task "${task.title}" (ID: ${task.id}) changed from ${originalPriority} to ${priority}.`,
      status: "success",
    });

    const updatedTask = await this.tasksRepository.save(task);

    // --- Send Notifications for Priority Change ---
    const frontendUrl =
      this.configService.get<string>("FRONTEND_URL") || "http://localhost:5173";
    const taskLink = `${frontendUrl}/tasks/${updatedTask.id}`;
    const message = `The priority of task "${updatedTask.title}" has been changed from ${originalPriority} to ${priority}.`;

    for (const assignee of originalAssignees) {
      if (assignee.id === reqUser.userId) continue; // Don't notify the user who made the change

      try {
        // Temporarily disable notification publishing
        // await this.notificationsService.createAndPublishNotification({
        //     type: 'TASK_PRIORITY_CHANGED',
        //     message: message,
        //     userId: assignee.id,
        //     relatedEntityType: 'Task',
        //     relatedEntityId: updatedTask.id,
        // });
        this.logger.warn(
          `Notification publishing temporarily disabled for TASK_PRIORITY_CHANGED for user ${assignee.id}`,
        );
        // this.logger.log(`Task priority change notification published for user ${assignee.id}`);
      } catch (notificationError) {
        this.logger.error(
          `Failed to publish task priority change notification for user ${assignee.id}: ${notificationError.message}`,
          notificationError.stack,
        );
      }
    }
    // --- End Notifications ---
    // return this.findOne(updatedTask.id); // Use Query Service
    return this.taskQueryService.findOne(updatedTask.id);
  }

  async remove(
    id: string,
    deleteTaskDto: DeleteTaskDto,
    reqUser: any,
  ): Promise<void> {
    // const task = await this.findOne(id); // Use Query Service
    const task = await this.taskQueryService.findOne(id);

    // --- Permission Check: REMOVED - Handled by PermissionsGuard ---
    // const isCreator = task.createdById === reqUser.userId;
    // const isAdminOrLeadership = this.rbacHelper.isAdminOrLeadership(reqUser); // Use helper
    // if (!isCreator && !isAdminOrLeadership) {
    //   throw new ForbiddenException(
    //     "You do not have permission to delete this task.",
    //   );
    // }
    // --- End Permission Check ---

    // Validate deletion reason
    if (
      !deleteTaskDto.deletionReason ||
      deleteTaskDto.deletionReason.length < 20
    ) {
      throw new BadRequestException(
        "A detailed deletion reason (at least 20 characters) is required",
      );
    }

    // Implement soft delete
    task.isDeleted = true;
    task.status = TaskStatus.DELETED;
    task.deletedAt = new Date();
    task.deletedById = reqUser.userId;
    task.deletionReason = deleteTaskDto.deletionReason;

    // Add activity log entry for soft deletion
    await this.activityLogService.createLog({
      user_id: reqUser.userId,
      action: "Task Deleted",
      target: "Task",
      target_id: id,
      details: `Task "${task.title}" (ID: ${id}) was moved to recycle bin. Reason: ${deleteTaskDto.deletionReason}`,
      status: "warning",
    });

    await this.tasksRepository.save(task);
  }

  async hardRemove(id: string, reqUser: any): Promise<void> {
    this.logger.log(
      `Attempting permanent deletion of task ${id} by user ${reqUser.userId} (${reqUser.role?.name})`,
    );
    // --- Permission Check: REMOVED - Handled by PermissionsGuard ---
    // if (!this.rbacHelper.isAdmin(reqUser)) {
    //   this.logger.warn(
    //     `Forbidden: User ${reqUser.userId} (${reqUser.role?.name}) attempted permanent delete without ADMIN role.`,
    //   );
    //   throw new ForbiddenException(
    //     "Only administrators can permanently delete tasks.",
    //   );
    // }
    // --- End Permission Check ---

    // const task = await this.findOne(id);
    const task = await this.taskQueryService.findOne(id);

    // Add activity log entry BEFORE hard deleting
    await this.activityLogService.createLog({
      user_id: reqUser.userId,
      action: "Task Permanently Deleted",
      target: "Task",
      target_id: id,
      details: `Task "${task.title}" (ID: ${id}) was permanently deleted from the system.`,
      status: "warning",
    });

    const result = await this.tasksRepository.delete(id);

    if (result.affected === 0) {
      throw new NotFoundException(`Task with ID ${id} could not be deleted.`);
    }
  }

  async restoreTask(id: string, reqUser: any): Promise<Task> {
    this.logger.log(
      `Attempting to restore task ${id} by user ${reqUser.userId} (${reqUser.role?.name})`,
    );

    // --- Permission Check: REMOVED - Handled by PermissionsGuard ---
    // const isAdminOrLeadership = this.rbacHelper.isAdminOrLeadership(reqUser); // Use helper
    // if (!isAdminOrLeadership) {
    //   this.logger.warn(
    //     `Forbidden: User ${reqUser.userId} (${reqUser.role?.name}) attempted restore without ADMIN/LEADERSHIP role.`,
    //   );
    //   throw new ForbiddenException(
    //     "You do not have permission to restore this task.",
    //   );
    // }
    // --- End Permission Check ---

    // const task = await this.findOne(id);
    const task = await this.taskQueryService.findOne(id);

    if (!task.isDeleted) {
      throw new BadRequestException("Task is not in recycle bin.");
    }

    // Restore task to original status before deletion
    task.isDeleted = false;
    task.status = TaskStatus.PENDING; // Reset to pending
    task.deletedAt = null;

    // Keep deletedById and deletionReason for audit trail

    // Add activity log entry
    await this.activityLogService.createLog({
      user_id: reqUser.userId,
      action: "Task Restored",
      target: "Task",
      target_id: id,
      details: `Task "${task.title}" (ID: ${id}) was restored from the recycle bin.`,
      status: "success",
    });

    const restoredTask = await this.tasksRepository.save(task);
    // return this.findOne(restoredTask.id);
    return this.taskQueryService.findOne(restoredTask.id);
  }

  //   return this.taskQueryService.findOne(updatedTask.id);
  // }

  /* PRD-Compliant Delegation Flow: 
   * This method is being replaced by requestTaskDelegation and approveOrRejectDelegation
   * to follow the creator approval workflow.
  async delegateTask(
    id: string,
    dto: DelegateTaskDto, // This DTO is now singular: delegatedToUserId
    delegatorInfo: any,
  ): Promise<Task[]> { // Original returned array of sub-tasks
    this.logger.log(
      `Attempting sub-task delegation of task ${id} by user ${delegatorInfo.userId} to users: ${dto.delegatedToUserId}`,
    );
    const originalTask = await this.taskQueryService.findOne(id);
    // ... (rest of the old complex sub-tasking logic commented out) ...
    return []; // Placeholder for commented out logic
  }
  */

  private async getAssigneesForNotification(task: Task): Promise<User[]> {
    let assignees: User[] = [];

    // Direct User Assignees
    if (task.assignedToUsers && task.assignedToUsers.length > 0) {
      assignees = assignees.concat(task.assignedToUsers);
    }

    // Department Assignees (Includes Province/Dept case implicitly)
    if (task.assignedToDepartments && task.assignedToDepartments.length > 0) {
      const departmentIds = task.assignedToDepartments.map((d) => d.id);
      try {
        let usersInDepartments: User[] = [];
        for (const deptId of departmentIds) {
          const users = await this.usersService.findUsersByDepartment(deptId);
          usersInDepartments = usersInDepartments.concat(users);
        }
        // Add unique users from departments
        usersInDepartments.forEach((deptUser) => {
          if (!assignees.some((existing) => existing.id === deptUser.id)) {
            assignees.push(deptUser);
          }
        });
      } catch (error) {
        this.logger.error(
          `Failed to get users for departments [${departmentIds.join(", ")}] for notification: ${error.message}`,
          error.stack,
        );
      }
    }

    return assignees; // Returns unique list of User entities
  }

  async updateAssignments(
    taskId: string,
    dto: UpdateTaskAssignmentsDto,
    reqUser: any, // Contains userId, roles etc. from JWT
  ): Promise<Task> {
    this.logger.log(
      `Updating assignments for task ${taskId} by user ${reqUser.userId} with DTO:`, 
      dto
    );

    const task = await this.taskQueryService.findOne(taskId, [
      "createdBy",
      "assignedToUsers",
      "assignedToDepartments",
      "assignedToProvince",
    ]);

    if (!task) {
      throw new NotFoundException(`Task with ID ${taskId} not found.`);
    }

    // --- Permission Check (Example) ---
    // This needs to align with your project's RBAC strategy.
    // For now, let's assume creator or admin/leadership can change assignments.
    const isCreator = task.createdById === reqUser.userId;
    const isAdminOrLeadership = reqUser.roles?.some(
      (role: string) => role === "admin" || role === "Leadership",
    );
    // const canUpdateAssignments = await this.taskQueryService.checkAssigneePermission(task, reqUser.userId); // Or if assignees can reassign

    if (!isCreator && !isAdminOrLeadership) {
      throw new ForbiddenException(
        "You do not have permission to update assignments for this task.",
      );
    }
    
    // Store original assignees for notification comparison later
    const originalAssigneesForNotification = await this.getAssigneesForNotification(task);

    // --- Clear Existing Assignments before applying new ones ---
    task.assignedToUsers = [];
    task.assignedToDepartments = [];
    task.assignedToProvinceId = null;
    task.assignedToProvince = null; // Clear the relation object too

    // --- Determine New Task Type and Apply New Assignments ---
    const { assignedToUserIds, assignedToDepartmentIds, assignedToProvinceId } =
      dto;

    const hasUsers = assignedToUserIds && assignedToUserIds.length > 0;
    const hasDepartments =
      assignedToDepartmentIds && assignedToDepartmentIds.length > 0;
    // For provinceId, `null` is a valid input to clear it, so check for string presence for actual ID.
    const hasProvince = typeof assignedToProvinceId === 'string' && assignedToProvinceId.length > 0;

    // --- Validation Logic (similar to create, but adapted for update context) ---
    if (hasUsers && (hasDepartments || hasProvince)) {
      throw new BadRequestException(
        "Cannot assign task to both users and departments/province simultaneously during update.",
      );
    }
    if (!hasDepartments && hasProvince) {
      throw new BadRequestException(
        "Province assignment requires at least one department assignment during update.",
      );
    }

    // --- Apply New Assignments based on DTO content ---
    if (hasUsers) {
      task.type = TaskType.USER;
      const users = await this.usersRepository.findBy({ id: In(assignedToUserIds!) });
      if (users.length !== assignedToUserIds!.length) {
        throw new BadRequestException("One or more assigned users not found.");
      }
      task.assignedToUsers = users;
      this.logger.debug(`Task ${taskId} updated to USER type, ${users.length} users.`);
    } else if (hasDepartments && hasProvince) {
      task.type = TaskType.PROVINCE_DEPARTMENT;
      const province = await this.provincesRepository.findOneBy({ id: assignedToProvinceId! });
      if (!province) {
        throw new BadRequestException(`Province with ID ${assignedToProvinceId} not found.`);
      }
      task.assignedToProvinceId = province.id;
      task.assignedToProvince = province; // Set relation object

      const departments = await this.departmentsRepository.find({
        where: { id: In(assignedToDepartmentIds!) },
        relations: ["province"],
      });
      if (departments.length !== assignedToDepartmentIds!.length) {
        throw new BadRequestException("One or more assigned departments not found.");
      }
      const invalidDepartments = departments.filter(d => d.provinceId !== province.id);
      if (invalidDepartments.length > 0) {
        throw new BadRequestException(
          `Departments [${invalidDepartments.map((d) => d.id).join(", ")}] do not belong to province ${province.id}.`,
        );
      }
      task.assignedToDepartments = departments;
      this.logger.debug(`Task ${taskId} updated to PROVINCE_DEPARTMENT type, province ${province.id}, ${departments.length} depts.`);
    } else if (hasDepartments) {
      task.type = TaskType.DEPARTMENT;
      const departments = await this.departmentsRepository.findBy({ id: In(assignedToDepartmentIds!) });
      if (departments.length !== assignedToDepartmentIds!.length) {
        throw new BadRequestException("One or more assigned departments not found.");
      }
      task.assignedToDepartments = departments;
      this.logger.debug(`Task ${taskId} updated to DEPARTMENT type, ${departments.length} depts.`);
    } else {
      // No specific assignments provided, or explicitly cleared -> Becomes PERSONAL
      task.type = TaskType.PERSONAL;
      const creatorUser = await this.usersRepository.findOneBy({ id: task.createdById });
      if (!creatorUser) {
        this.logger.error(`Failed to find creator ${task.createdById} for personal task ${taskId}.`);
        throw new InternalServerErrorException("Could not assign task to creator.");
      }
      task.assignedToUsers = [creatorUser];
      this.logger.debug(`Task ${taskId} updated to PERSONAL type.`);
    }

    const updatedTask = await this.tasksRepository.save(task);
    this.logger.log(`Task ${taskId} assignments updated successfully.`);
    
    // --- Handle Notifications for assignment changes ---
    // Reload task with relations for notifications
    const taskForNotification = await this.taskQueryService.findOne(updatedTask.id, [
        "assignedToUsers", 
        "assignedToDepartments", 
        "assignedToProvince", 
        "createdBy"
    ]);
    if (taskForNotification) {
        await this.sendTaskAssignmentChangeNotifications(taskForNotification, originalAssigneesForNotification, reqUser);
    }

    return this.taskQueryService.findOne(updatedTask.id); // Return the full updated task
  }

  private async sendTaskAssignmentChangeNotifications(task: Task, originalAssignees: User[], actor: any) {
    const currentAssignees = await this.getAssigneesForNotification(task);
    const frontendUrl = this.configService.get<string>("FRONTEND_URL") || "http://localhost:5173";
    const taskLink = `${frontendUrl}/tasks/${task.id}`;

    const newAssignees = currentAssignees.filter(ca => !originalAssignees.some(oa => oa.id === ca.id));
    const removedAssignees = originalAssignees.filter(oa => !currentAssignees.some(ca => ca.id === oa.id));

    const commonEmailVars = {
        taskTitle: task.title,
        taskLink: taskLink,
        actorUsername: actor.username || 'System',
        dueDate: task.dueDate ? task.dueDate.toLocaleDateString() : "N/A",
        taskDescription: task.description || "No description provided.",
    };

    for (const user of newAssignees) {
        if (user.id === actor.userId) continue; // Don't notify actor of their own action
        this.logger.log(`Notifying new assignee ${user.username} for task ${task.id}`);
        // TODO: Send TASK_NEWLY_ASSIGNED email and in-app notification
        await this.mailService.sendTemplatedEmail(user.email, "TASK_NEWLY_ASSIGNED", {
            ...commonEmailVars,
            username: user.username,
        }).catch(e => this.logger.error(`Failed to send TASK_NEWLY_ASSIGNED email to ${user.email}: ${e.message}`));
    }

    for (const user of removedAssignees) {
        if (user.id === actor.userId) continue;
        this.logger.log(`Notifying removed assignee ${user.username} for task ${task.id}`);
        // TODO: Send TASK_REMOVED_FROM_ASSIGNMENT email and in-app notification
        await this.mailService.sendTemplatedEmail(user.email, "TASK_REMOVED_FROM_ASSIGNMENT", {
            ...commonEmailVars,
            username: user.username,
        }).catch(e => this.logger.error(`Failed to send TASK_REMOVED_FROM_ASSIGNMENT email to ${user.email}: ${e.message}`));
    }
    // Consider notifying the task creator if assignments change significantly, unless they are the actor.
    if (task.createdBy && task.createdById !== actor.userId && (newAssignees.length > 0 || removedAssignees.length > 0)) {
        this.logger.log(`Notifying creator ${task.createdBy.username} of assignment changes for task ${task.id}`);
        // TODO: Send TASK_ASSIGNMENT_CHANGED email and in-app notification to creator
        await this.mailService.sendTemplatedEmail(task.createdBy.email, "TASK_ASSIGNMENT_CHANGED", {
            ...commonEmailVars,
            username: task.createdBy.username,
            changerUsername: actor.username || 'System',
        }).catch(e => this.logger.error(`Failed to send TASK_ASSIGNMENT_CHANGED email to creator ${task.createdBy.email}: ${e.message}`));
    }
  }

  /* PRD-Compliant Flow: 
   * This method's functionality for a creator assigning tasks is covered by create() or updateAssignments().
   * The delegation flow as per PRD (assignee initiates, creator approves) is handled by 
   * requestTaskDelegation and approveOrRejectDelegation.
  async delegateTaskAssignmentsByCreator(
    taskId: string,
    dto: DelegateTaskDto, // This DTO is now singular: delegatedToUserId
    requestingUser: any, // UserDocument or similar, contains userId
  ): Promise<Task> {
    this.logger.log(
      `User ${requestingUser.userId} attempting to delegate assignments for task ${taskId} to user: ${dto.delegatedToUserId}`,
    );
    const task = await this.taskQueryService.findOne(taskId, [
      // ... relations ...
    ]);
    // ... (rest of the old logic commented out) ...
    if (!task) throw new NotFoundException(); // Placeholder
    return task; // Placeholder
  }
  */

  async requestTaskDelegation(
    originalTaskId: string,
    dto: DelegateTaskDto, // Contains delegatedToUserId, reason
    delegatorUser: User, // Full User object of the person initiating the delegation
  ): Promise<Task> {
    this.logger.log(
      `User ${delegatorUser.id} requesting delegation for task ${originalTaskId} to user ${dto.delegatedToUserId}. Reason: ${dto.reason}`,
    );

    const originalTask = await this.taskQueryService.findOne(originalTaskId, [
      "createdBy",
      "assignedToUsers",
      "assignedToDepartments", // to check if delegator is an assignee
      "assignedToDepartments.members"
    ]);

    if (!originalTask) {
      throw new NotFoundException(`Task with ID ${originalTaskId} not found.`);
    }

    // 1. Permission Check: Only an assignee of the task can request delegation.
    // (Admins/Leadership might have other ways, but this is for user-initiated delegation)
    let isAssignee = originalTask.assignedToUsers.some(u => u.id === delegatorUser.id);
    if (!isAssignee && originalTask.assignedToDepartments) {
        for (const dept of originalTask.assignedToDepartments) {
            // Ensure members are loaded for the department
            const deptWithMembers = await this.departmentsRepository.findOne({where: {id: dept.id}, relations: ["members"]});
            if (deptWithMembers && deptWithMembers.members && deptWithMembers.members.some(m => m.id === delegatorUser.id)) {
                isAssignee = true;
                break;
            }
        }
    }

    if (!isAssignee) {
      throw new ForbiddenException("You are not an assignee of this task and cannot delegate it.");
    }
    
    if (originalTask.createdById === dto.delegatedToUserId) {
        throw new BadRequestException("Cannot delegate a task back to its creator.");
    }

    if (originalTask.assignedToUsers.some(u => u.id === dto.delegatedToUserId) || 
        (await this.taskQueryService.isUserInAssignedDepartments(dto.delegatedToUserId, originalTask.assignedToDepartments))) {
        throw new BadRequestException("The target user is already an assignee of this task.");
    }


    // 2. Check Task Status: Cannot delegate completed, cancelled, or already delegated (pending/approved) tasks.
    if ([TaskStatus.COMPLETED, TaskStatus.CANCELLED, TaskStatus.DELETED].includes(originalTask.status)) {
      throw new BadRequestException(`Cannot delegate a task that is already ${originalTask.status}.`);
    }
    if (originalTask.delegationStatus === DelegationRequestStatus.PENDING_APPROVAL || originalTask.delegationStatus === DelegationRequestStatus.APPROVED) {
      throw new BadRequestException("This task already has a pending or approved delegation request.");
    }

    // 3. Validate Target User for Delegation
    const targetUser = await this.usersService.findById(dto.delegatedToUserId);
    if (!targetUser) {
      throw new NotFoundException(`User to delegate to (ID: ${dto.delegatedToUserId}) not found.`);
    }
    if (targetUser.id === delegatorUser.id) {
      throw new BadRequestException("Cannot delegate a task to yourself.");
    }


    // 4. Update Original Task for Pending Delegation
    originalTask.pendingDelegatedToUserId = targetUser.id;
    originalTask.delegationReason = dto.reason; // Reason from the delegator
    originalTask.delegationStatus = DelegationRequestStatus.PENDING_APPROVAL;
    originalTask.delegatedByUserId = delegatorUser.id; // Track who initiated this current delegation cycle
    
    // Clear any previous rejection details
    originalTask.delegationReviewComment = null;
    originalTask.delegatedToTaskId = null; // Clear if a previous delegation was rejected and this is a new attempt

    const updatedTask = await this.tasksRepository.save(originalTask);
    this.logger.log(`Task ${originalTask.id} delegation request to user ${targetUser.id} is pending approval from creator ${originalTask.createdById}.`);

    // 5. Notify Task Creator
    const creator = originalTask.createdBy;
    if (creator && creator.id !== delegatorUser.id) { // Don't notify if creator is self-delegating (though usually not the flow)
      const frontendUrl = this.configService.get<string>("FRONTEND_URL") || "http://localhost:5173";
      // TODO: Define specific links for approval/rejection if using deep links
      const approvalLink = `${frontendUrl}/tasks/${originalTask.id}/delegation?action=approve`; // Example
      const rejectionLink = `${frontendUrl}/tasks/${originalTask.id}/delegation?action=reject`; // Example

      await this.mailService.sendTaskDelegationRequestedEmail(
        creator,
        originalTask,
        delegatorUser,
        targetUser,
        dto.reason,
        approvalLink,
        rejectionLink,
      );
      // TODO: Add in-app notification to creator
      this.logger.debug(`Sent delegation request notification to creator ${creator.email} for task ${originalTask.id}`);
    }
    
    // Activity Log
    await this.activityLogService.createLog({
        user_id: delegatorUser.id,
        action: "REQUEST_TASK_DELEGATION",
        target: "Task",
        target_id: originalTask.id,
        details: `Delegation of task "${originalTask.title}" to user ${targetUser.username} requested. Reason: ${dto.reason}`,
    });

    return this.taskQueryService.findOne(updatedTask.id, ["createdBy", "pendingDelegatedToUser", "delegatedBy"]);
  }

  async approveOrRejectDelegation(
    originalTaskId: string, 
    dto: UpdateDelegationStatusDto, // status (APPROVED/REJECTED), rejectionReason
    creatorUser: User, // Full User object of the creator performing the action
  ): Promise<Task> {
    this.logger.log(
      `Creator ${creatorUser.id} attempting to ${dto.status} delegation for task ${originalTaskId}. Reason: ${dto.rejectionReason || 'N/A'}`,
    );

    const originalTask = await this.taskQueryService.findOne(originalTaskId, [
      "createdBy", 
      "pendingDelegatedToUser", 
      "delegatedBy", // User who initiated the delegation request
      "assignedToUsers", // For notifications
      "assignedToDepartments", "assignedToDepartments.members" // For notifications
    ]);

    if (!originalTask) {
      throw new NotFoundException(`Task with ID ${originalTaskId} not found.`);
    }

    // 1. Permission Check: Only the task creator can approve/reject.
    if (originalTask.createdById !== creatorUser.id) {
      throw new ForbiddenException("Only the task creator can approve or reject this delegation request.");
    }

    // 2. Validate State: Task must be in PENDING_APPROVAL status.
    if (originalTask.delegationStatus !== DelegationRequestStatus.PENDING_APPROVAL) {
      throw new BadRequestException("This task does not have a pending delegation request or has already been actioned.");
    }
    if (!originalTask.pendingDelegatedToUserId || !originalTask.delegatedByUserId) {
        throw new InternalServerErrorException("Task is in an inconsistent state for delegation review (missing pending user or delegator).");
    }

    const delegator = originalTask.delegatedBy; // User who requested delegation
    const delegatee = originalTask.pendingDelegatedToUser; // User to whom task was to be delegated

    if (!delegatee) {
        throw new InternalServerErrorException("Pending delegatee user not found, though ID was present.");
    }
    if (!delegator) {
        throw new InternalServerErrorException("Delegator user not found, though ID was present.");
    }

    let finalUpdatedTask: Task;

    if (dto.status === DelegationRequestStatus.APPROVED) {
      originalTask.delegationStatus = DelegationRequestStatus.APPROVED;
      originalTask.status = TaskStatus.DELEGATED; // Original task is now "delegated"
      originalTask.delegationReviewComment = dto.rejectionReason ?? null; // Can use this field for an approval comment too

      // Create the new delegated task for the target user (delegatee)
      const delegatedTaskEntity = new Task();
      delegatedTaskEntity.title = originalTask.title; // Or prepend "(Delegated) "
      delegatedTaskEntity.description = originalTask.description;
      delegatedTaskEntity.priority = originalTask.priority;
      delegatedTaskEntity.dueDate = originalTask.dueDate;
      delegatedTaskEntity.createdById = originalTask.createdById; // Still created by the original creator
      delegatedTaskEntity.type = originalTask.type; // Type remains same or could be USER if original was dept
                                                 // For PRD simplicity, let's keep original type, assigned to specific user
      delegatedTaskEntity.assignedToUsers = [delegatee];
      delegatedTaskEntity.status = TaskStatus.PENDING; // New task for delegatee starts as PENDING
      
      delegatedTaskEntity.isDelegated = true; // This new task *is* a result of delegation
      delegatedTaskEntity.delegatedFromTaskId = originalTask.id;
      delegatedTaskEntity.delegatedByUserId = delegator.id; // The user who initiated the request to delegate originalTask
      // Note: delegatedTaskEntity.delegationReason could be originalTask.delegationReason
      delegatedTaskEntity.delegationReason = originalTask.delegationReason;

      const savedDelegatedTask = await this.tasksRepository.save(delegatedTaskEntity);
      originalTask.delegatedToTaskId = savedDelegatedTask.id; // Link original task to its new delegated part
      
      finalUpdatedTask = await this.tasksRepository.save(originalTask);
      this.logger.log(`Delegation for task ${originalTask.id} to user ${delegatee.id} APPROVED by creator. New delegated task ID: ${savedDelegatedTask.id}.`);

      // Notify delegator and delegatee
      const taskLinkOriginal = `${this.configService.get<string>("FRONTEND_URL")}/tasks/${originalTask.id}`;
      const taskLinkDelegated = `${this.configService.get<string>("FRONTEND_URL")}/tasks/${savedDelegatedTask.id}`;

      await this.mailService.sendTaskDelegationStatusUpdateEmail(delegator, originalTask, true, delegatee.username, undefined, taskLinkOriginal);
      await this.mailService.sendTaskDelegationStatusUpdateEmail(delegatee, originalTask, true, delegatee.username, undefined, taskLinkDelegated);
      // TODO: In-app notifications
      
       // Activity Log for original task
        await this.activityLogService.createLog({
            user_id: creatorUser.id,
            action: "APPROVE_TASK_DELEGATION",
            target: "Task",
            target_id: originalTask.id,
            details: `Delegation of task "${originalTask.title}" to ${delegatee.username} approved. New delegated task: ${savedDelegatedTask.id}`,
        });
         // Activity Log for new delegated task
        await this.activityLogService.createLog({
            user_id: creatorUser.id, // Or delegator.id if we consider them creating the sub-task via approval
            action: "CREATE_DELEGATED_TASK",
            target: "Task",
            target_id: savedDelegatedTask.id,
            details: `New task "${savedDelegatedTask.title}" created via delegation from task ${originalTask.id}, assigned to ${delegatee.username}`,
        });

    } else { // REJECTED
      if (!dto.rejectionReason) {
        throw new BadRequestException("A reason is required for rejecting a delegation request.");
      }
      originalTask.delegationStatus = DelegationRequestStatus.REJECTED;
      originalTask.delegationReviewComment = dto.rejectionReason;
      // originalTask.status remains what it was before PENDING_APPROVAL (e.g., PENDING, IN_PROGRESS)
      // Clear pending fields
      originalTask.pendingDelegatedToUserId = null;
      // originalTask.delegatedByUserId = null; // Keep to know who made the last rejected request
      // originalTask.delegationReason = null; // Keep reason from delegator for context

      finalUpdatedTask = await this.tasksRepository.save(originalTask);
      this.logger.log(`Delegation for task ${originalTask.id} to user ${delegatee.id} REJECTED by creator. Reason: ${dto.rejectionReason}`);

      // Notify delegator of rejection
      await this.mailService.sendTaskDelegationStatusUpdateEmail(delegator, originalTask, false, delegatee.username, dto.rejectionReason);
      // TODO: In-app notification to delegator

      // Activity Log
        await this.activityLogService.createLog({
            user_id: creatorUser.id,
            action: "REJECT_TASK_DELEGATION",
            target: "Task",
            target_id: originalTask.id,
            details: `Delegation of task "${originalTask.title}" to ${delegatee.username} rejected. Reason: ${dto.rejectionReason}`,
        });
    }
    return this.taskQueryService.findOne(finalUpdatedTask.id, ["createdBy", "pendingDelegatedToUser", "delegatedBy", "delegatedToTask"]);
  }
}
