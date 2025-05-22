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
    this.logger.log("Creating task with DTO:", createTaskDto);
    this.logger.log("Creating user ID:", creatorId);

    try {
      const task = new Task();
      task.title = createTaskDto.title;
      task.description = createTaskDto.description ?? '';
      task.priority = createTaskDto.priority || TaskPriority.MEDIUM;
      task.dueDate = createTaskDto.dueDate
        ? new Date(createTaskDto.dueDate)
        : null;
      task.createdById = creatorId; // Set from creatorId
      task.status = TaskStatus.PENDING; // Default status
      task.isDelegated = false; // New tasks are not delegated by default
      task.assignedToUsers = []; // Initialize relations
      task.assignedToDepartments = [];
      task.assignedToProvinceId = null;

      // --- Determine Task Type and Validate Assignments ---
      const hasUsers =
        createTaskDto.assignedToUserIds &&
        createTaskDto.assignedToUserIds.length > 0;
      const hasDepartments =
        createTaskDto.assignedToDepartmentIds &&
        createTaskDto.assignedToDepartmentIds.length > 0;
      const hasProvince = createTaskDto.assignedToProvinceId;

      if (hasUsers && hasDepartments) {
        throw new BadRequestException(
          "Cannot assign task to both users and departments simultaneously.",
        );
      }
      if (hasUsers && hasProvince) {
        throw new BadRequestException(
          "Cannot assign task to users and specify a province.",
        );
      }
      if (!hasDepartments && hasProvince) {
        throw new BadRequestException(
          "Province assignment requires at least one department assignment.",
        );
      }

      if (hasUsers) {
        // USER Assignment
        task.type = TaskType.USER;
        const userIds = createTaskDto.assignedToUserIds; // Definite array here
        const users = await this.usersRepository.findBy({ id: In(userIds!) });
        if (users.length !== userIds!.length) {
          const foundIds = users.map((u) => u.id);
          const notFoundIds = userIds!.filter((id) => !foundIds.includes(id));
          throw new BadRequestException(
            `One or more assigned users not found: ${notFoundIds.join(", ")}`,
          );
        }
        task.assignedToUsers = users;
        this.logger.debug(`Task type set to USER, assigned to ${task.assignedToUsers.length} users.`);
      } else if (hasDepartments && hasProvince) {
        // PROVINCE_DEPARTMENT Assignment
        task.type = TaskType.PROVINCE_DEPARTMENT;
        const departmentIds = createTaskDto.assignedToDepartmentIds; // Definite array here

        // Validate Province
        const province = await this.provincesRepository.findOneBy({
          id: createTaskDto.assignedToProvinceId,
        });
        if (!province) {
          throw new BadRequestException(
            `Province with ID ${createTaskDto.assignedToProvinceId} not found.`,
          );
        }
        task.assignedToProvinceId = province.id;

        // Validate Departments and their link to the Province
        // Fetch full department entities once for relation and validation
        const departments = await this.departmentsRepository.find({
          where: { id: In(departmentIds!) },
          relations: ["province"], // Include province to check provinceId directly if needed, or rely on province object fetched above
        });

        if (departments.length !== departmentIds!.length) {
          const foundIds = departments.map((d) => d.id);
          const notFoundIds = departmentIds!.filter(
            (id) => !foundIds.includes(id),
          );
          throw new BadRequestException(
            `One or more assigned departments not found: ${notFoundIds.join(", ")}`,
          );
        }
        const invalidDepartments = departments.filter(
          // Ensure dept.province is loaded or dept.provinceId exists on the entity
          (dept) => (dept.province && dept.province.id !== province.id) || dept.provinceId !== province.id,
        );
        if (invalidDepartments.length > 0) {
          throw new BadRequestException(
            `Departments [${invalidDepartments.map((d) => d.id).join(", ")}] do not belong to province ${province.id}.`,
          );
        }
        task.assignedToDepartments = departments; // Assign the fetched full entities
        this.logger.debug(`Task type set to PROVINCE_DEPARTMENT, province ${province.id}, assigned to ${task.assignedToDepartments.length} departments.`);
      } else if (hasDepartments) {
        // DEPARTMENT Assignment
        task.type = TaskType.DEPARTMENT;
        const departmentIds = createTaskDto.assignedToDepartmentIds; // Definite array here
        const departments = await this.departmentsRepository.findBy({
          id: In(departmentIds!),
        });
        if (departments.length !== departmentIds!.length) {
          const foundIds = departments.map((d) => d.id);
          const notFoundIds = departmentIds!.filter(
            (id) => !foundIds.includes(id),
          );
          throw new BadRequestException(
            `One or more assigned departments not found: ${notFoundIds.join(", ")}`,
          );
        }
        task.assignedToDepartments = departments;
        this.logger.debug(`Task type set to DEPARTMENT, assigned to ${task.assignedToDepartments.length} departments.`);
      } else {
        // PERSONAL Assignment (Default)
        task.type = TaskType.PERSONAL;
        // Assign to self if personal
        const creatorUser = await this.usersRepository.findOneBy({
          id: creatorId,
        });
        if (!creatorUser) {
          throw new NotFoundException(
            `Creator user with ID ${creatorId} not found.`,
          );
        }
        task.assignedToUsers = [creatorUser];
        this.logger.debug("Task type set to PERSONAL, assigned to creator.");
      }
      // ----------------------------------------------

      this.logger.debug("Task object before save:", task);
      const savedTask = await this.tasksRepository.save(task);
      this.logger.log("Task saved successfully with ID:", savedTask.id);

      // --- Send Notifications (Email and In-App/Teams via Redis) ---
      const frontendUrl =
        this.configService.get<string>("FRONTEND_URL") ||
        "http://localhost:5173";
      const taskLink = `${frontendUrl}/tasks/${savedTask.id}`; // Construct link to the task

      // Reload the saved task with relations needed for notifications
      const taskWithRelations = await this.tasksRepository.findOne({
        where: { id: savedTask.id },
        relations: [
          "assignedToUsers", // Need emails, IDs and usernames
          "assignedToDepartments", // Need department names and IDs
          "createdBy", // Potentially useful, though we have the user object
        ],
      });

      if (!taskWithRelations) {
        this.logger.error(
          `Failed to reload task ${savedTask.id} for sending notifications.`,
        );
      } else {
        // --- User Assignment Notifications ---
        if (
          taskWithRelations.type === TaskType.USER &&
          taskWithRelations.assignedToUsers
        ) {
          for (const assignedUser of taskWithRelations.assignedToUsers) {
            if (assignedUser.id === creatorId) continue;

            // Send Email (Existing Logic)
            try {
              await this.mailService.sendTemplatedEmail(
                assignedUser.email,
                "TASK_ASSIGNED_USER",
                {
                  username: assignedUser.username,
                  taskTitle: taskWithRelations.title,
                  dueDate: taskWithRelations.dueDate
                    ? taskWithRelations.dueDate.toLocaleDateString()
                    : "N/A",
                  taskDescription:
                    taskWithRelations.description || "No description provided.",
                  taskLink: taskLink,
                },
              );
              this.logger.log(
                `Task assignment email sent to user ${assignedUser.email}`,
              );
            } catch (emailError) {
              this.logger.error(
                `Failed to send task assignment email to user ${assignedUser.email}: ${emailError.message}`,
                emailError.stack,
              );
            }

            // Publish Redis Notification (New Logic)
            try {
              // Temporarily disable notification publishing
              // await this.notificationsService.createAndPublishNotification({
              //   type: 'TASK_ASSIGNED',
              //   message: `You have been assigned a new task: "${taskWithRelations.title}" by ${taskWithRelations.createdBy?.username || 'Unknown User'}`,
              //   userId: assignedUser.id, // Target the specific assigned user
              //   relatedEntityType: 'Task',
              //   relatedEntityId: savedTask.id,
              // });
              this.logger.warn(
                `Notification publishing temporarily disabled for TASK_ASSIGNED for user ${assignedUser.id}`,
              );
              // this.logger.log(`Task assignment notification published for user ${assignedUser.id}`);
            } catch (notificationError) {
              this.logger.error(
                `Failed to publish task assignment notification for user ${assignedUser.id}: ${notificationError.message}`,
                notificationError.stack,
              );
            }
          }
          // --- Department Assignment Notifications ---
        } else if (
          (taskWithRelations.type === TaskType.DEPARTMENT ||
            taskWithRelations.type === TaskType.PROVINCE_DEPARTMENT) &&
          taskWithRelations.assignedToDepartments
        ) {
          const departmentIds = taskWithRelations.assignedToDepartments.map(
            (d) => d.id,
          );
          if (departmentIds.length > 0) {
            try {
              // Fetch users for each department and combine/deduplicate
              let allUsersInDepartments: User[] = [];
              for (const deptId of departmentIds) {
                const users =
                  await this.usersService.findUsersByDepartment(deptId);
                allUsersInDepartments = allUsersInDepartments.concat(users);
              }
              // Ensure unique users
              const uniqueUsersMap = new Map<string, User>();
              allUsersInDepartments.forEach((u) => {
                // Ensure the user object has departments loaded for the check below
                if (!uniqueUsersMap.has(u.id)) {
                  uniqueUsersMap.set(u.id, u);
                }
              });
              const uniqueUsers = Array.from(uniqueUsersMap.values());

              for (const deptUser of uniqueUsers) {
                if (deptUser.id === creatorId) continue;

                // Find which assigned department(s) this user belongs to for context
                // Use the originally fetched assignedToDepartments for name
                const userDepartment =
                  taskWithRelations.assignedToDepartments.find((assignedDept) =>
                    deptUser.departments?.some(
                      (userDept) => userDept.id === assignedDept.id,
                    ),
                  );
                const departmentName = userDepartment
                  ? userDepartment.name
                  : "relevant department"; // Fallback name

                // Send Email (Existing Logic)
                try {
                  await this.mailService.sendTemplatedEmail(
                    deptUser.email,
                    "TASK_ASSIGNED_DEPARTMENT",
                    {
                      username: deptUser.username,
                      taskTitle: taskWithRelations.title,
                      departmentName: departmentName,
                      dueDate: taskWithRelations.dueDate
                        ? taskWithRelations.dueDate.toLocaleDateString()
                        : "N/A",
                      taskDescription:
                        taskWithRelations.description ||
                        "No description provided.",
                      taskLink: taskLink,
                    },
                  );
                  this.logger.log(
                    `Task assignment email sent to department user ${deptUser.email}`,
                  );
                } catch (emailError) {
                  this.logger.error(
                    `Failed to send task assignment email to department user ${deptUser.email}: ${emailError.message}`,
                    emailError.stack,
                  );
                }

                // Publish Redis Notification (New Logic)
                try {
                  // Temporarily disable notification publishing
                  // await this.notificationsService.createAndPublishNotification({
                  //     type: 'TASK_ASSIGNED_DEPARTMENT',
                  //     message: `A new task "${taskWithRelations.title}" relevant to your department (${departmentName}) has been created by ${taskWithRelations.createdBy?.username || 'Unknown User'}`,
                  //     userId: deptUser.id, // Target the specific user in the department
                  //     relatedEntityType: 'Task',
                  //     relatedEntityId: savedTask.id,
                  //     // Optionally add departmentId if needed downstream
                  //     // departmentId: userDepartment?.id
                  // });
                  this.logger.warn(
                    `Notification publishing temporarily disabled for TASK_ASSIGNED_DEPARTMENT for user ${deptUser.id}`,
                  );
                  // this.logger.log(`Task assignment notification published for department user ${deptUser.id}`);
                } catch (notificationError) {
                  this.logger.error(
                    `Failed to publish task assignment notification for department user ${deptUser.id}: ${notificationError.message}`,
                    notificationError.stack,
                  );
                }
              }
            } catch (deptUserError) {
              this.logger.error(
                `Error processing department assignment notifications: ${deptUserError.message}`,
                deptUserError.stack,
              );
            }
          }
        }
      }
      // --- End Send Notifications ---

      // Log activity
      try {
        await this.activityLogService.createLog({
          user_id: creatorId,
          action: "CREATE_TASK",
          target: "Task",
          target_id: savedTask.id,
          details: `Created task: ${savedTask.title}`,
          // ip_address: // We don't have the request object here easily
        });
        this.logger.log(`Activity logged for task creation: ${savedTask.id}`);
      } catch (logError) {
        this.logger.error(
          `Failed to log activity for task creation ${savedTask.id}: ${logError.message}`,
          logError.stack,
        );
        // Decide if this should prevent returning the task
      }

      return savedTask;
    } catch (error) {
      this.logger.error(`Error creating task: ${error.message}`, error.stack, { createTaskDto, userId: creatorId });
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      )
        throw error;
      throw new BadRequestException(
        `Failed to create task: ${error.message || "Unknown error"}`,
      );
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

  async delegateTask(
    id: string,
    dto: DelegateTaskDto,
    delegatorInfo: any,
  ): Promise<Task[]> {
    this.logger.log(
      `Attempting sub-task delegation of task ${id} by user ${delegatorInfo.userId} to users:`,
      dto.delegatedToUserIds,
    );
    // const originalTask = await this.findOne(id);
    const originalTask = await this.taskQueryService.findOne(id);
    const originalAssignees =
      await this.getAssigneesForNotification(originalTask);

    // Fetch the delegator's full entity with departments for permission checks
    const delegatorUserEntity = await this.usersService.findById(delegatorInfo.userId, ["departments"]);
    if (!delegatorUserEntity) {
      this.logger.error(`Delegator user ${delegatorInfo.userId} performing action not found.`);
      throw new NotFoundException(`Delegator user ${delegatorInfo.userId} not found.`);
    }

    // --- Permission Check: REMOVED - Handled by PermissionsGuard ---
    const isCreator = originalTask.createdById === delegatorInfo.userId;
    const isAssignee = await this.taskQueryService.checkAssigneePermission(
      originalTask,
      delegatorInfo.userId,
      delegatorUserEntity, // Pass the fetched user entity
    );
    // const isAdminOrLeadership = this.rbacHelper.isAdminOrLeadership(delegatorUserEntity); // Use helper
    const isAdminOrLeadership = ["ADMIN", "LEADERSHIP"].includes(delegatorUserEntity.role?.name);

    if (!isCreator && !isAssignee && !isAdminOrLeadership) {
      this.logger.warn(
        `Forbidden: User ${delegatorInfo.userId} attempted delegation of task ${id} without permission.`,
      );
      throw new ForbiddenException(
        "You do not have permission to delegate this task.",
      );
    }
    // --- End Permission Check ---

    // Check if already completed/cancelled
    if (
      [TaskStatus.COMPLETED, TaskStatus.CANCELLED].includes(originalTask.status)
    ) {
      throw new BadRequestException(
        "Cannot delegate a completed or cancelled task.",
      );
    }
    // Check if already delegated (optional - depends on desired workflow)
    // if (originalTask.isDelegated) {
    //     throw new BadRequestException('This task has already been delegated.');
    // }

    // Validate new assignees
    const newAssignees = await this.usersRepository.find({
      where: { id: In(dto.delegatedToUserIds) },
    });
    if (newAssignees.length !== dto.delegatedToUserIds.length) {
      const foundIds = newAssignees.map((u) => u.id);
      const notFoundIds = dto.delegatedToUserIds.filter(
        (id) => !foundIds.includes(id),
      );
      this.logger.error(
        `Delegation failed for task ${id}: One or more new assignees not found: ${notFoundIds.join(", ")}`,
      );
      throw new BadRequestException(
        `One or more new assignees not found: ${notFoundIds.join(", ")}`,
      );
    }

    // Prevent delegating to the original creator or the delegator themselves if they are not also an assignee
    // This is complex logic, maybe simplify later - for now, let it pass

    // --- Create Subtasks for each new assignee ---
    const delegatedTasks: Task[] = [];
    const delegatorUser = delegatorUserEntity; 

    if (!delegatorUser) {
      this.logger.error(
        `Delegation failed for task ${id}: Delegator user ${delegatorInfo.userId} not found (this should not happen if fetched above).`,
      );
      throw new NotFoundException("Delegator user not found"); // Should be caught by the earlier check of delegatorUserEntity
    }

    const delegationTime = new Date();

    for (const assignee of newAssignees) {
      // Create subtask by explicitly mapping fields
      const subTask = this.tasksRepository.create({
        // Inherit relevant fields
        title: `(Delegated) ${originalTask.title}`,
        description: originalTask.description,
        priority: originalTask.priority,
        dueDate: originalTask.dueDate,
        createdById: delegatorInfo.userId, // Delegator creates the subtask

        // Delegation specific fields
        delegatedFromTaskId: originalTask.id, // Correct field name
        delegatedByUserId: delegatorInfo.userId,
        isDelegated: true,

        // Subtask specific fields
        id: undefined, // Generate new UUID
        status: TaskStatus.PENDING,
        type: TaskType.USER,
        assignedToUsers: [assignee],
        assignedToDepartments: [],
        assignedToProvinceId: null,

        // Reset fields
        completedAt: null,
        cancelledAt: null,
        cancelledById: null,
        cancellationReason: null,
        deletedAt: null,
        deletedById: null,
        deletionReason: null,
        isDeleted: false,
      });

      const savedSubTask = await this.tasksRepository.save(subTask);
      delegatedTasks.push(savedSubTask);
      this.logger.log(
        `Created delegated subtask ${savedSubTask.id} for task ${id}, assigned to ${assignee.id}`,
      );

      // Send Notification for the subtask creation
      try {
        const frontendUrl =
          this.configService.get<string>("FRONTEND_URL") ||
          "http://localhost:5173";
        const subTaskLink = `${frontendUrl}/tasks/${savedSubTask.id}`;

        // Email Notification
        await this.mailService.sendTemplatedEmail(
          assignee.email,
          "TASK_DELEGATED_TO_YOU",
          {
            username: assignee.username,
            delegatorName: delegatorUser.username,
            originalTaskTitle: originalTask.title,
            taskTitle: savedSubTask.title,
            delegationReason: "Task delegated via sub-task creation", // Placeholder if original dto.delegationReason was used
            taskLink: subTaskLink,
          },
        );

        // In-App Notification
        // Temporarily disable notification publishing
        // await this.notificationsService.createAndPublishNotification({
        //   type: 'TASK_DELEGATED',
        //   message: `${delegatorUser.username} delegated a task to you: "${savedSubTask.title}" (Origin: ${originalTask.title})`,
        //   userId: assignee.id,
        //   relatedEntityType: 'Task',
        //   relatedEntityId: savedSubTask.id,
        // });
        this.logger.warn(
          `Notification publishing temporarily disabled for TASK_DELEGATED for user ${assignee.id}`,
        );
        // this.logger.log(`Sent delegation notification for subtask ${savedSubTask.id} to user ${assignee.id}`);
      } catch (notificationError) {
        this.logger.error(
          `Failed to send delegation notification for subtask ${savedSubTask.id} to ${assignee.id}: ${notificationError.message}`,
          notificationError.stack,
        );
      }
    }

    // --- Update Original Task Status --- (Only if it wasn't already completed/cancelled)
    if (
      ![TaskStatus.COMPLETED, TaskStatus.CANCELLED].includes(
        originalTask.status,
      )
    ) {
      originalTask.status = TaskStatus.DELEGATED;
      // removed: originalTask.delegatedAt = delegationTime; // No such field
      await this.tasksRepository.save(originalTask);
      this.logger.log(
        `Updated original task ${id} status to DELEGATED at ${delegationTime.toISOString()}.`,
      ); // Log time if needed

      // --- Notify Original Assignees (if any) that task was delegated ---
      if (originalAssignees && originalAssignees.length > 0) {
        for (const assignee of originalAssignees) {
          // Avoid notifying the delegator or the new assignees again
          if (
            assignee.id === delegatorInfo.userId ||
            newAssignees.some((na) => na.id === assignee.id)
          ) {
            continue;
          }
          try {
            // Temporarily disable notification publishing
            // await this.notificationsService.createAndPublishNotification({
            //    type: 'TASK_DELEGATION_NOTICE',
            //    message: `The task "${originalTask.title}" you were assigned to has been delegated by ${delegatorUser.username}.`,
            //    userId: assignee.id,
            //    relatedEntityType: 'Task',
            //    relatedEntityId: originalTask.id, // Relate to the original task
            //  });
            this.logger.warn(
              `Notification publishing temporarily disabled for TASK_DELEGATION_NOTICE for user ${assignee.id}`,
            );
            //  this.logger.log(`Sent delegation notice for task ${id} to original assignee ${assignee.id}`);
          } catch (notificationError) {
            this.logger.error(
              `Failed to send delegation notice for task ${id} to original assignee ${assignee.id}: ${notificationError.message}`,
              notificationError.stack,
            );
          }
        }
      }
    }

    // Return the newly created subtasks
    return delegatedTasks;
  }

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

  async delegateTaskAssignmentsByCreator(
    taskId: string,
    dto: DelegateTaskDto,
    requestingUser: any, // UserDocument or similar, contains userId
  ): Promise<Task> {
    this.logger.log(
      `User ${requestingUser.userId} attempting to delegate assignments for task ${taskId} to users: ${dto.delegatedToUserIds.join(', ')}`,
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

    // --- Strict Permission Check: Only the creator can delegate ---
    if (task.createdById !== requestingUser.userId) {
      this.logger.warn(
        `Forbidden: User ${requestingUser.userId} (not creator ${task.createdById}) attempted to delegate task ${taskId}.`,
      );
      throw new ForbiddenException("Only the task creator can delegate this task.");
    }

    // Prevent delegation of completed or cancelled tasks
    if ([TaskStatus.COMPLETED, TaskStatus.CANCELLED, TaskStatus.DELETED].includes(task.status)) {
      throw new BadRequestException(
        `Cannot delegate a task that is already ${task.status}.`,
      );
    }
    
    const originalAssigneesForNotification = await this.getAssigneesForNotification(task);

    // Validate new assignees
    const newAssigneeUsers = await this.usersRepository.find({
      where: { id: In(dto.delegatedToUserIds) },
    });
    if (newAssigneeUsers.length !== dto.delegatedToUserIds.length) {
      const foundIds = newAssigneeUsers.map((u) => u.id);
      const notFoundIds = dto.delegatedToUserIds.filter(
        (id) => !foundIds.includes(id),
      );
      this.logger.error(
        `Delegation failed for task ${taskId}: One or more new assignees not found: ${notFoundIds.join(', ')}`,
      );
      throw new BadRequestException(
        `One or more new assignees not found: ${notFoundIds.join(', ')}`,
      );
    }

    // --- Update Task Assignments and Type ---
    task.assignedToUsers = newAssigneeUsers;
    task.type = TaskType.USER;

    // Clear other assignment types
    task.assignedToDepartments = [];
    task.assignedToProvinceId = null;
    task.assignedToProvince = null;

    // Clear fields related to the other (sub-task) delegation flow
    task.isDelegated = false;
    task.delegatedByUserId = null;
    task.delegatedBy = null;
    task.delegatedFromTaskId = null;
    task.delegatedFromTask = null;

    const updatedTask = await this.tasksRepository.save(task);
    this.logger.log(
      `Task ${taskId} assignments successfully delegated by creator ${requestingUser.userId} to ${newAssigneeUsers.length} users.`,
    );

    // --- Handle Notifications for assignment changes ---
    const taskForNotification = await this.taskQueryService.findOne(updatedTask.id, [
        "assignedToUsers", 
        "assignedToDepartments",
        "assignedToProvince", 
        "createdBy"
    ]);

    if (taskForNotification) {
        const actor = { 
            userId: requestingUser.userId, 
            username: requestingUser.username || (taskForNotification.createdBy ? taskForNotification.createdBy.username : 'Creator')
        };
        await this.sendTaskAssignmentChangeNotifications(taskForNotification, originalAssigneesForNotification, actor);
    }
    
    // Add activity log
    await this.activityLogService.createLog({
      user_id: requestingUser.userId,
      action: "TASK_DELEGATED_BY_CREATOR",
      target: "Task",
      target_id: updatedTask.id,
      details: `Task "${updatedTask.title}" assignments delegated by creator to users: ${newAssigneeUsers.map(u => u.username || u.id).join(', ')}.`,
      status: "success",
    });

    return this.taskQueryService.findOne(updatedTask.id);
  }
}
