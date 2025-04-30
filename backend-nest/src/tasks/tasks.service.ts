import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  InternalServerErrorException,
  Logger,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository, SelectQueryBuilder, Not } from "typeorm";
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
import { forwardRef, Inject } from "@nestjs/common";
import { UpdateTaskStatusDto } from "./dto/update-task-status.dto";
import { UpdateTaskPriorityDto } from "./dto/update-task-priority.dto";
import { UsersService } from "../users/users.service";
import { ActivityLog } from "../admin/entities/activity-log.entity";
import { DelegateTaskDto } from "./dto/delegate-task.dto";
import { DeleteTaskDto } from "./dto/delete-task.dto";
import { RecycleBinQueryDto } from "./dto/recycle-bin-query.dto";
import { MailService } from "../mail/mail.service";
import { ConfigService } from "@nestjs/config";
// import { NotificationsService } from '../notifications/notifications.service'; // Temporarily commented out

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
    // Temporarily comment out injection
    // private readonly notificationsService: NotificationsService,
  ) {}

  async create(createTaskDto: CreateTaskDto, user: any): Promise<Task> {
    console.log(
      "Creating task with DTO:",
      JSON.stringify(createTaskDto, null, 2),
    );
    console.log("Creating user:", JSON.stringify(user, null, 2));

    try {
      const task = new Task();
      task.title = createTaskDto.title;
      task.description = createTaskDto.description;
      task.priority = createTaskDto.priority || TaskPriority.MEDIUM;
      task.dueDate = createTaskDto.dueDate
        ? new Date(createTaskDto.dueDate)
        : null;
      task.createdById = user.userId; // Set from the authenticated user
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
        console.log(
          `Task type set to USER, assigned to ${task.assignedToUsers.length} users.`,
        );
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
        const departments = await this.departmentsRepository.find({
          where: { id: In(departmentIds!) },
          select: ["id", "provinceId"], // Select only necessary fields
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
          (dept) => dept.provinceId !== province.id,
        );
        if (invalidDepartments.length > 0) {
          throw new BadRequestException(
            `Departments [${invalidDepartments.map((d) => d.id).join(", ")}] do not belong to province ${province.id}.`,
          );
        }
        // We need the full department entities for the relation
        task.assignedToDepartments = await this.departmentsRepository.findBy({
          id: In(departmentIds!),
        });
        console.log(
          `Task type set to PROVINCE_DEPARTMENT, province ${province.id}, assigned to ${task.assignedToDepartments.length} departments.`,
        );
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
        console.log(
          `Task type set to DEPARTMENT, assigned to ${task.assignedToDepartments.length} departments.`,
        );
      } else {
        // PERSONAL Assignment (Default)
        task.type = TaskType.PERSONAL;
        // Assign to self if personal
        const creatorUser = await this.usersRepository.findOneBy({
          id: user.userId,
        });
        if (!creatorUser) {
          throw new NotFoundException(
            `Creator user with ID ${user.userId} not found.`,
          );
        }
        task.assignedToUsers = [creatorUser];
        console.log("Task type set to PERSONAL, assigned to creator.");
      }
      // ----------------------------------------------

      console.log("Task object before save:", JSON.stringify(task, null, 2));
      const savedTask = await this.tasksRepository.save(task);
      console.log("Task saved successfully with ID:", savedTask.id);

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
            if (assignedUser.id === user.userId) continue;

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
                if (deptUser.id === user.userId) continue;

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
          user_id: user.userId,
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
      console.error("Error creating task:", error);
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

  async findAll(query: any, user: any): Promise<Task[]> {
    try {
      let queryBuilder = this.tasksRepository
        .createQueryBuilder("task")
        .leftJoinAndSelect("task.createdBy", "createdBy")
        .leftJoinAndSelect("task.assignedToUsers", "assignedToUsers")
        .leftJoinAndSelect(
          "task.assignedToDepartments",
          "assignedToDepartments",
        );

      // Apply explicit filters from query string
      if (query.departmentId) {
        // Ensure correct alias if task is joined with department
        // Assuming assignedToDepartments relation is correctly joined
        queryBuilder = queryBuilder.andWhere(
          "assignedToDepartments.id = :departmentId",
          { departmentId: query.departmentId },
        );
      }

      if (query.status) {
        queryBuilder = queryBuilder.andWhere("task.status = :status", {
          status: query.status,
        });
      }

      // Removed context filter as it's not part of Task entity currently
      // if (query.context) {
      //   queryBuilder = queryBuilder.andWhere('task.context = :context', { context: query.context });
      // }

      const includeAll =
        query.include_all === "true" || query.include_all === true;

      // --- Role-Based Filtering Logic ---
      if (user.role?.name === "LEADERSHIP") {
        // Leadership sees all tasks, respecting only query filters applied above
        console.log(
          `User role is LEADERSHIP. Fetching all tasks respecting query filters.`,
        );
      } else if (user.role?.name === "ADMIN") {
        // Admins also see all tasks, respecting only query filters applied above
        console.log(
          `User role is ADMIN. Fetching all tasks respecting query filters.`,
        );
      } else {
        // Default User Role - includes former MANAGER and GENERAL_MANAGER roles
        if (query.task_type === "my_tasks") {
          queryBuilder = queryBuilder.andWhere("task.createdById = :userId", {
            userId: user.userId,
          });
        } else if (query.task_type === "assigned") {
          // User sees tasks directly assigned to them or to their departments
          queryBuilder = queryBuilder.andWhere(
            "(assignedToUsers.id = :userId OR assignedToDepartments.id IN (SELECT department_id FROM user_departments WHERE user_id = :userId))",
            { userId: user.userId },
          );
        } else {
          // Default: User sees tasks created by them, assigned to them, or assigned to their departments
          queryBuilder = queryBuilder.andWhere(
            "(task.createdById = :userId OR assignedToUsers.id = :userId OR assignedToDepartments.id IN (SELECT department_id FROM user_departments WHERE user_id = :userId))",
            { userId: user.userId },
          );
        }
        console.log(`User role is USER. Applying standard user filters.`);
      }
      // --- End Role-Based Filtering ---

      const tasks = await queryBuilder.getMany();
      console.log(
        `Found ${tasks.length} tasks with relations loaded for user ${user.userId} (${user.role?.name})`,
      );
      return tasks;
    } catch (error) {
      console.error("Error finding tasks:", error);
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
          "createdBy",
          "assignedToUsers",
          "assignedToDepartments",
          "assignedToProvince",
          "delegatedBy",
          "delegatedFromTask",
        ],
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
  private async checkAssigneePermission(
    task: Task,
    userId: string,
  ): Promise<boolean> {
    // Check direct user assignment
    if (
      task.assignedToUsers &&
      task.assignedToUsers.some((user) => user.id === userId)
    ) {
      return true;
    }

    // Check department-only assignment (TaskType.DEPARTMENT)
    if (
      task.type === TaskType.DEPARTMENT &&
      task.assignedToDepartments &&
      task.assignedToDepartments.length > 0
    ) {
      const userWithDepartments = await this.usersRepository.findOne({
        where: { id: userId },
        relations: ["departments"],
      });
      if (!userWithDepartments || !userWithDepartments.departments)
        return false;

      const userDepartmentIds = userWithDepartments.departments.map(
        (dept) => dept.id,
      );
      const taskDepartmentIds = task.assignedToDepartments.map(
        (dept) => dept.id,
      );
      if (
        taskDepartmentIds.some((taskDeptId) =>
          userDepartmentIds.includes(taskDeptId),
        )
      ) {
        return true;
      }
    }

    // Check province/department assignment (TaskType.PROVINCE_DEPARTMENT)
    if (
      task.type === TaskType.PROVINCE_DEPARTMENT &&
      task.assignedToProvinceId &&
      task.assignedToDepartments &&
      task.assignedToDepartments.length > 0
    ) {
      const userWithDepartments = await this.usersRepository.findOne({
        where: { id: userId },
        relations: ["departments"], // We need department provinceId
      });
      if (!userWithDepartments || !userWithDepartments.departments)
        return false;

      // Filter user's departments to only those belonging to the task's province
      const userDepartmentIdsInProvince = userWithDepartments.departments
        .filter((dept) => dept.provinceId === task.assignedToProvinceId)
        .map((dept) => dept.id);

      if (userDepartmentIdsInProvince.length === 0) return false; // User has no departments in the target province

      const taskDepartmentIds = task.assignedToDepartments.map(
        (dept) => dept.id,
      );

      // Check if user belongs to any of the *specific* departments assigned within that province
      if (
        taskDepartmentIds.some((taskDeptId) =>
          userDepartmentIdsInProvince.includes(taskDeptId),
        )
      ) {
        return true;
      }
    }

    return false; // Not an assignee by any relevant mechanism
  }

  async update(
    id: string,
    updateTaskDto: UpdateTaskDto,
    reqUser: any,
  ): Promise<Task> {
    const task = await this.findOne(id); // findOne already loads relations

    // --- Permission Check: Only creator or Admin/Leadership can edit general details ---
    const isCreator = task.createdById === reqUser.userId;
    // Check against role name string
    const isAdminOrLeadership = ["ADMIN", "LEADERSHIP"].includes(
      reqUser.role?.name,
    );
    if (!isCreator && !isAdminOrLeadership) {
      throw new ForbiddenException(
        "Only the task creator, admin, or leadership can edit the task details.",
      );
    }
    // --- End Permission Check ---

    // Store original state for logging
    const originalTaskJson = JSON.stringify(task); // Simple way to capture original state

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
      return this.findOne(updatedTask.id); // Return task with relations
    } else {
      console.log(`No changes detected for task ${id}. Skipping save.`);
      return task; // Return original task if no changes
    }
  }

  async updateStatus(
    id: string,
    updateTaskStatusDto: UpdateTaskStatusDto,
    reqUser: any,
  ): Promise<Task> {
    const task = await this.findOne(id); // Ensure relations are loaded
    const { status, cancellationReason } = updateTaskStatusDto;
    const originalStatus = task.status;
    // Store original assignees *before* potentially changing the task state
    const originalAssignees = await this.getAssigneesForNotification(task);

    if (originalStatus === status) {
      console.warn(
        `Task ${id} is already in status ${status}. No update performed.`,
      );
      return task; // Return task unchanged
    }

    // --- Permission Check ---
    const isCreator = task.createdById === reqUser.userId;
    const isAssignee = await this.checkAssigneePermission(task, reqUser.userId);
    // Check against role name string
    const isAdminOrLeadership = ["ADMIN", "LEADERSHIP"].includes(
      reqUser.role?.name,
    );

    let canChangeStatus = false;

    // Rule: Only creator or admin/leadership can cancel
    if (status === TaskStatus.CANCELLED) {
      if (isCreator || isAdminOrLeadership) {
        // Check for cancellation reason
        if (!cancellationReason || cancellationReason.length < 20) {
          throw new BadRequestException(
            "A detailed cancellation reason (at least 20 characters) is required",
          );
        }

        canChangeStatus = true;

        // Set cancellation metadata
        task.cancelledAt = new Date();
        task.cancelledById = reqUser.userId;
        task.cancellationReason = cancellationReason;
      } else {
        throw new ForbiddenException(
          "Only the task creator, admin, or leadership can cancel the task.",
        );
      }
      if (task.status === TaskStatus.COMPLETED) {
        throw new BadRequestException(
          `Cannot cancel a task that is already completed.`,
        );
      }
    }
    // Rule: Assignee or creator (or admin/leadership) can move between PENDING, IN_PROGRESS, COMPLETED
    else if (
      [
        TaskStatus.PENDING,
        TaskStatus.IN_PROGRESS,
        TaskStatus.COMPLETED,
      ].includes(status)
    ) {
      // Anyone involved (creator, assignee) or with override power (admin/leadership) can manage the active lifecycle.
      if (isCreator || isAssignee || isAdminOrLeadership) {
        // Prevent moving *from* CANCELLED unless creator/admin/leadership
        if (
          originalStatus === TaskStatus.CANCELLED &&
          !isCreator &&
          !isAdminOrLeadership
        ) {
          throw new ForbiddenException(
            "Only the creator, admin, or leadership can move a task from Cancelled status.",
          );
        }
        // Prevent moving *from* DELEGATED manually (should happen via delegation logic)
        if (originalStatus === TaskStatus.DELEGATED) {
          throw new BadRequestException(
            "Cannot manually change status from DELEGATED.",
          );
        }
        canChangeStatus = true;
      } else {
        throw new ForbiddenException(
          "You do not have permission to change the status of this task.",
        );
      }
    }
    // Rule: Only delegation logic should set DELEGATED status
    else if (status === TaskStatus.DELEGATED) {
      throw new BadRequestException(
        "Task status cannot be manually set to DELEGATED.",
      );
    } else {
      throw new BadRequestException(`Invalid target status: ${status}`);
    }

    if (!canChangeStatus) {
      // This case should ideally be caught by specific throws above, but acts as a safeguard.
      throw new ForbiddenException("Status update not permitted by rules.");
    }
    // --- End Permission Check ---

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

    return this.findOne(updatedTask.id); // Return with relations
  }

  async updatePriority(
    id: string,
    updateTaskPriorityDto: UpdateTaskPriorityDto,
    reqUser: any,
  ): Promise<Task> {
    const task = await this.findOne(id);
    const { priority } = updateTaskPriorityDto;
    const originalPriority = task.priority;
    // Store original assignees *before* potentially changing the task state
    const originalAssignees = await this.getAssigneesForNotification(task);

    if (originalPriority === priority) {
      console.warn(
        `Task ${id} already has priority ${priority}. No update performed.`,
      );
      return task;
    }

    // --- Permission Check: Only creator, assignee, or admin/leadership can change priority ---
    const isCreator = task.createdById === reqUser.userId;
    const isAssignee = await this.checkAssigneePermission(task, reqUser.userId);
    // Check against role name string
    const isAdminOrLeadership = ["ADMIN", "LEADERSHIP"].includes(
      reqUser.role?.name,
    );

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

    return this.findOne(updatedTask.id); // Return with relations
  }

  async remove(
    id: string,
    deleteTaskDto: DeleteTaskDto,
    reqUser: any,
  ): Promise<void> {
    const task = await this.findOne(id); // Ensures task exists and loads createdById

    // --- Permission Check: Only creator, admin, or leadership can delete ---
    const isCreator = task.createdById === reqUser.userId;
    // Check against role name string
    const isAdminOrLeadership = ["ADMIN", "LEADERSHIP"].includes(
      reqUser.role?.name,
    );

    if (!isCreator && !isAdminOrLeadership) {
      throw new ForbiddenException(
        "You do not have permission to delete this task.",
      );
    }
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
    // --- Permission Check: Only ADMIN ---
    // Check against role name string
    if (reqUser.role?.name !== "ADMIN") {
      this.logger.warn(
        `Forbidden: User ${reqUser.userId} (${reqUser.role?.name}) attempted permanent delete without ADMIN role.`,
      );
      throw new ForbiddenException(
        "Only administrators can permanently delete tasks.",
      );
    }
    // --- End Permission Check ---

    const task = await this.findOne(id);

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

    // --- Permission Check: Admin or Leadership ---
    // Check against role name string
    const isAdminOrLeadership = ["ADMIN", "LEADERSHIP"].includes(
      reqUser.role?.name,
    );
    if (!isAdminOrLeadership) {
      this.logger.warn(
        `Forbidden: User ${reqUser.userId} (${reqUser.role?.name}) attempted restore without ADMIN/LEADERSHIP role.`,
      );
      throw new ForbiddenException(
        "You do not have permission to restore this task.",
      );
    }
    // --- End Permission Check ---

    const task = await this.findOne(id);

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
    return this.findOne(restoredTask.id);
  }

  async findAllDeleted(
    query: RecycleBinQueryDto,
    reqUser: any,
  ): Promise<[Task[], number]> {
    this.logger.log(
      `Fetching deleted tasks for user ${reqUser.userId} (${reqUser.role?.name}) with query:`,
      query,
    );
    // --- Permission Check: Admin or Leadership ---
    // Check against role name string
    const isAdminOrLeadership = ["ADMIN", "LEADERSHIP"].includes(
      reqUser.role?.name,
    );
    if (!isAdminOrLeadership) {
      this.logger.warn(
        `Forbidden: User ${reqUser.userId} (${reqUser.role?.name}) attempted to access recycle bin without ADMIN/LEADERSHIP role.`,
      );
      throw new ForbiddenException(
        "You do not have permission to view the recycle bin.",
      );
    }
    // --- End Permission Check ---

    const queryBuilder = this.tasksRepository
      .createQueryBuilder("task")
      .leftJoinAndSelect("task.createdBy", "createdBy")
      .leftJoinAndSelect("task.deletedBy", "deletedBy")
      .leftJoinAndSelect("task.assignedToUsers", "assignedToUsers")
      .leftJoinAndSelect("task.assignedToDepartments", "assignedToDepartments")
      .leftJoinAndSelect("task.assignedToProvince", "assignedToProvince")
      .where("task.isDeleted = :isDeleted", { isDeleted: true });

    // Apply search filters
    if (query.search) {
      queryBuilder.andWhere(
        "(task.title LIKE :search OR task.description LIKE :search OR task.deletionReason LIKE :search)",
        { search: `%${query.search}%` },
      );
    }

    // Filter by user
    if (query.userId) {
      queryBuilder.andWhere("task.createdById = :userId", {
        userId: query.userId,
      });
    }

    // Filter by department
    if (query.departmentId) {
      queryBuilder.andWhere("assignedToDepartments.id = :departmentId", {
        departmentId: query.departmentId,
      });
    }

    // Filter by province
    if (query.provinceId) {
      queryBuilder.andWhere(
        "(task.assignedToProvinceId = :provinceId OR assignedToDepartments.provinceId = :provinceId)",
        { provinceId: query.provinceId },
      );
    }

    // Filter by deleted user
    if (query.deletedByUserId) {
      queryBuilder.andWhere("task.deletedById = :deletedByUserId", {
        deletedByUserId: query.deletedByUserId,
      });
    }

    // Filter by date range
    if (query.fromDate) {
      queryBuilder.andWhere("task.deletedAt >= :fromDate", {
        fromDate: new Date(query.fromDate),
      });
    }
    if (query.toDate) {
      queryBuilder.andWhere("task.deletedAt <= :toDate", {
        toDate: new Date(query.toDate),
      });
    }

    // Apply sorting
    const sortBy = query.sortBy || "deletedAt";
    const sortOrder = query.sortOrder || "DESC";
    queryBuilder.orderBy(`task.${sortBy}`, sortOrder);

    // Apply pagination
    const page = query.page ? parseInt(query.page, 10) : 1;
    const limit = query.limit ? parseInt(query.limit, 10) : 10;
    const skip = (page - 1) * limit;

    queryBuilder.skip(skip).take(limit);

    // Execute query and return paginated results
    const [tasks, total] = await queryBuilder.getManyAndCount();
    return [tasks, total];
  }

  async delegateTask(
    id: string,
    dto: DelegateTaskDto,
    delegatorInfo: any,
  ): Promise<Task[]> {
    this.logger.log(
      `Attempting delegation of task ${id} by user ${delegatorInfo.userId} (${delegatorInfo.role?.name}) to users:`,
      dto.newAssigneeUserIds,
    );
    const originalTask = await this.findOne(id);

    // Get original assignees BEFORE modifying the task for notifications
    const originalAssignees =
      await this.getAssigneesForNotification(originalTask);

    // --- Permission Check: Creator, Assignee, Admin, or Leadership ---
    const isCreator = originalTask.createdById === delegatorInfo.userId;
    const isAssignee = await this.checkAssigneePermission(
      originalTask,
      delegatorInfo.userId,
    );
    const isAdminOrLeadership = ["ADMIN", "LEADERSHIP"].includes(
      delegatorInfo.role?.name,
    );

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
      where: { id: In(dto.newAssigneeUserIds) },
    });
    if (newAssignees.length !== dto.newAssigneeUserIds.length) {
      const foundIds = newAssignees.map((u) => u.id);
      const notFoundIds = dto.newAssigneeUserIds.filter(
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
    const delegatorUser = await this.usersRepository.findOneBy({
      id: delegatorInfo.userId,
    });
    if (!delegatorUser) {
      this.logger.error(
        `Delegation failed for task ${id}: Delegator user ${delegatorInfo.userId} not found.`,
      );
      throw new NotFoundException("Delegator user not found");
    }

    const delegationTime = new Date(); // Capture time for logging/metadata if needed

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
            delegationReason: dto.delegationReason || "No reason provided",
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

  async getDashboardTasks(userId: string): Promise<DashboardTasksResponse> {
    try {
      const user = await this.usersRepository.findOne({
        where: { id: userId },
        relations: ["departments"],
      });

      if (!user) {
        throw new NotFoundException(`User with ID ${userId} not found.`);
      }

      const departmentIds = user.departments
        ? user.departments.map((d) => d.id)
        : [];

      // Fetch tasks using updated helper methods
      const myPersonalTasks = await this.getMyPersonalTasks(userId);
      const tasksICreatedForOthers =
        await this.getTasksCreatedByUserForOthers(userId);
      const tasksAssignedToMe =
        await this.getTasksAssignedToUserExplicitly(userId);
      const tasksAssignedToMyDepartments =
        await this.getTasksForDepartments(departmentIds);
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

      console.log(
        `[TasksService] Dashboard data lengths: Personal=${response.myPersonalTasks.length}, Created=${response.tasksICreatedForOthers.length}, Assigned=${response.tasksAssignedToMe.length}, DeptTasks=${response.tasksAssignedToMyDepartments.length}, DelegatedBy=${response.tasksDelegatedByMe.length}, DelegatedTo=${response.tasksDelegatedToMe.length}`,
      );

      return response;
    } catch (error) {
      console.error(
        `[TasksService] Error fetching dashboard tasks for user ${userId}:`,
        error,
      );
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        `Failed to retrieve dashboard tasks: ${error.message}`,
      );
    }
  }

  // --- Updated Helper methods for Dashboard ---

  async getMyPersonalTasks(userId: string): Promise<Task[]> {
    console.log(`Fetching personal tasks for user ${userId}`);
    try {
      return await this.tasksRepository.find({
        where: {
          createdById: userId,
          type: TaskType.PERSONAL,
          isDelegated: false,
        },
        relations: [
          "assignedToUsers",
          "assignedToDepartments",
          "assignedToProvince",
          "delegatedBy",
          "createdBy",
        ],
        order: { createdAt: "DESC" },
      });
    } catch (error) {
      console.error(`Error fetching personal tasks for user ${userId}:`, error);
      throw new Error(`Failed to fetch personal tasks: ${error.message}`);
    }
  }

  async getTasksAssignedToUserExplicitly(userId: string): Promise<Task[]> {
    console.log(
      `Fetching tasks assigned explicitly (non-personal) to user ${userId}`,
    );
    try {
      return await this.tasksRepository
        .createQueryBuilder("task")
        .innerJoin("task.assignedToUsers", "user")
        .where("user.id = :userId", { userId })
        .andWhere("task.type != :personalType", {
          personalType: TaskType.PERSONAL,
        })
        .andWhere("task.isDelegated = :isDelegated", { isDelegated: false })
        .leftJoinAndSelect("task.createdBy", "createdBy")
        .leftJoinAndSelect(
          "task.assignedToDepartments",
          "assignedToDepartments",
        )
        .leftJoinAndSelect("task.assignedToProvince", "assignedToProvince")
        .leftJoinAndSelect("task.delegatedBy", "delegatedBy")
        .orderBy("task.createdAt", "DESC")
        .getMany();
    } catch (error) {
      console.error(
        `Error fetching non-personal tasks assigned to user ${userId}:`,
        error,
      );
      throw new Error(
        `Failed to fetch assigned non-personal tasks: ${error.message}`,
      );
    }
  }

  async getTasksCreatedByUserForOthers(userId: string): Promise<Task[]> {
    console.log(
      `Fetching tasks created by user ${userId} for others (non-personal)`,
    );
    try {
      return await this.tasksRepository.find({
        where: {
          createdById: userId,
          type: Not(TaskType.PERSONAL), // Use TypeORM's Not operator
          isDelegated: false,
        },
        relations: [
          "assignedToUsers",
          "assignedToDepartments",
          "assignedToProvince",
          "delegatedBy",
          "createdBy",
        ],
        order: { createdAt: "DESC" },
      });
    } catch (error) {
      console.error(
        `Error fetching non-personal tasks created by user ${userId}:`,
        error,
      );
      throw new Error(
        `Failed to fetch created non-personal tasks: ${error.message}`,
      );
    }
  }

  // NEW Helper method to get tasks for multiple department IDs
  async getTasksForDepartments(departmentIds: string[]): Promise<Task[]> {
    if (!departmentIds || departmentIds.length === 0) {
      return [];
    }
    console.log(
      `[TasksService] Fetching tasks for departments: ${departmentIds.join(", ")}`,
    );
    try {
      return await this.tasksRepository
        .createQueryBuilder("task")
        .innerJoin("task.assignedToDepartments", "department")
        .where("department.id IN (:...departmentIds)", { departmentIds })
        .leftJoinAndSelect("task.createdBy", "createdBy")
        .leftJoinAndSelect("task.assignedToUsers", "assignedToUsers")
        .leftJoinAndSelect(
          "task.assignedToDepartments",
          "assignedToDepartments_rel",
        ) // Re-select for full data
        .orderBy("task.createdAt", "DESC")
        .getMany();
    } catch (error) {
      console.error(
        `[TasksService] Error fetching tasks for departments ${departmentIds.join(", ")}:`,
        error,
      );
      return []; // Return empty array on error
    }
  }

  // START: Implement Specific Task Fetch Methods
  async getTasksAssignedToUser(userId: string): Promise<Task[]> {
    console.log(`Fetching tasks assigned directly to user ${userId}`);
    try {
      // Use query builder for explicit alias
      return await this.tasksRepository
        .createQueryBuilder("task")
        .innerJoin("task.assignedToUsers", "user") // Alias the joined user table as 'user'
        .where("user.id = :userId", { userId }) // Use alias in where clause
        .andWhere("task.isDelegated = :isDelegated", { isDelegated: false })
        .leftJoinAndSelect("task.createdBy", "createdBy")
        .leftJoinAndSelect(
          "task.assignedToDepartments",
          "assignedToDepartments",
        )
        .leftJoinAndSelect("task.assignedToProvince", "assignedToProvince")
        .leftJoinAndSelect("task.delegatedBy", "delegatedBy")
        .orderBy("task.createdAt", "DESC")
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
        relations: [
          "assignedToUsers",
          "assignedToDepartments",
          "assignedToProvince",
          "delegatedBy",
          "createdBy",
        ],
        order: { createdAt: "DESC" },
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
        relations: [
          "createdBy",
          "assignedToUsers",
          "assignedToDepartments",
          "assignedToProvince",
          "delegatedBy",
          "delegatedFromTask",
        ],
        order: { createdAt: "DESC" },
      });
    } catch (error) {
      console.error(`Error fetching tasks delegated by user ${userId}:`, error);
      throw new Error(
        `Failed to fetch tasks delegated by user: ${error.message}`,
      );
    }
  }

  async getTasksDelegatedToUser(userId: string): Promise<Task[]> {
    console.log(`Fetching tasks delegated to user ${userId}`);
    try {
      // Use query builder for explicit alias
      return await this.tasksRepository
        .createQueryBuilder("task")
        .innerJoin("task.assignedToUsers", "user") // Alias the joined user table as 'user'
        .where("user.id = :userId", { userId }) // Use alias in where clause
        .andWhere("task.isDelegated = :isDelegated", { isDelegated: true })
        .leftJoinAndSelect("task.createdBy", "createdBy")
        .leftJoinAndSelect(
          "task.assignedToDepartments",
          "assignedToDepartments",
        )
        .leftJoinAndSelect("task.assignedToProvince", "assignedToProvince")
        .leftJoinAndSelect("task.delegatedBy", "delegatedBy")
        .leftJoinAndSelect("task.delegatedFromTask", "delegatedFromTask")
        .orderBy("task.createdAt", "DESC")
        .getMany();
    } catch (error) {
      console.error(`Error fetching tasks delegated to user ${userId}:`, error);
      throw new Error(
        `Failed to fetch tasks delegated to user: ${error.message}`,
      );
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
          assignedToDepartments: { id: departmentId },
        },
        relations: [
          "createdBy",
          "assignedToUsers",
          "assignedToDepartments",
          "assignedToProvince",
          "delegatedBy",
          "delegatedFromTask",
        ],
        order: { createdAt: "DESC" },
      });
    } catch (error) {
      console.error(
        `Error fetching tasks for department ${departmentId}:`,
        error,
      );
      // Re-throw NotFoundException if department validation fails
      if (error instanceof NotFoundException) throw error;
      throw new Error(
        `Failed to fetch tasks for department ${departmentId}: ${error.message}`,
      );
    }
  }

  async getTasksForUser(userId: string): Promise<Task[]> {
    console.log(`Fetching tasks assigned to user ${userId}`);
    try {
      // Validate user exists first (optional)
      // await this.usersRepository.findOneByOrFail({ id: userId });

      return await this.tasksRepository.find({
        where: {
          assignedToUsers: { id: userId },
        },
        relations: [
          "createdBy",
          "assignedToUsers",
          "assignedToDepartments",
          "assignedToProvince",
          "delegatedBy",
          "delegatedFromTask",
        ],
        order: { createdAt: "DESC" },
      });
    } catch (error) {
      console.error(`Error fetching tasks for user ${userId}:`, error);
      if (error instanceof NotFoundException) throw error;
      throw new Error(
        `Failed to fetch tasks for user ${userId}: ${error.message}`,
      );
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
          { assignedToDepartments: { provinceId: provinceId } }, // Assigned to departments linked to this province
        ],
        relations: [
          "createdBy",
          "assignedToUsers",
          "assignedToDepartments",
          "assignedToProvince",
          "delegatedBy",
          "delegatedFromTask",
        ],
        order: { createdAt: "DESC" },
      });
    } catch (error) {
      console.error(`Error fetching tasks for province ${provinceId}:`, error);
      if (error instanceof NotFoundException) throw error;
      throw new Error(
        `Failed to fetch tasks for province ${provinceId}: ${error.message}`,
      );
    }
  }
  // END: Implement Department/User/Province Task Fetch Methods

  // START: NEW Methods for Aggregated Status Counts

  async getTaskCountsByStatusForDepartment(
    departmentId: string,
  ): Promise<TaskStatusCounts> {
    console.log(
      `[TasksService] Calculating task counts by status for department ${departmentId}`,
    );
    try {
      const counts = await this.tasksRepository
        .createQueryBuilder("task")
        .select("task.status", "status")
        .addSelect("COUNT(task.id)", "count")
        .innerJoin("task.assignedToDepartments", "department")
        .where("department.id = :departmentId", { departmentId })
        .groupBy("task.status")
        .getRawMany(); // [{ status: 'PENDING', count: '5' }, ...]

      // Initialize counts object
      const statusCounts: TaskStatusCounts = {
        [TaskStatus.PENDING]: 0,
        [TaskStatus.IN_PROGRESS]: 0,
        [TaskStatus.COMPLETED]: 0,
        [TaskStatus.CANCELLED]: 0,
        [TaskStatus.DELEGATED]: 0,
      };

      counts.forEach((row) => {
        if (statusCounts.hasOwnProperty(row.status)) {
          statusCounts[row.status as TaskStatus] = parseInt(row.count, 10);
        }
      });

      console.log(
        `[TasksService] Counts for department ${departmentId}:`,
        statusCounts,
      );
      return statusCounts;
    } catch (error) {
      console.error(
        `[TasksService] Error calculating task counts for department ${departmentId}:`,
        error,
      );
      throw new Error(
        `Failed to calculate task counts for department: ${error.message}`,
      );
    }
  }

  async getTaskCountsByStatusForUser(
    userId: string,
  ): Promise<TaskStatusCounts> {
    console.log(
      `[TasksService] Calculating task counts by status for user ${userId}`,
    );
    try {
      const counts = await this.tasksRepository
        .createQueryBuilder("task")
        .select("task.status", "status")
        .addSelect("COUNT(task.id)", "count")
        .innerJoin("task.assignedToUsers", "user")
        .where("user.id = :userId", { userId })
        .groupBy("task.status")
        .getRawMany(); // [{ status: 'PENDING', count: '3' }, ...]

      // Initialize counts object
      const statusCounts: TaskStatusCounts = {
        [TaskStatus.PENDING]: 0,
        [TaskStatus.IN_PROGRESS]: 0,
        [TaskStatus.COMPLETED]: 0,
        [TaskStatus.CANCELLED]: 0,
        [TaskStatus.DELEGATED]: 0,
      };

      counts.forEach((row) => {
        if (statusCounts.hasOwnProperty(row.status)) {
          statusCounts[row.status as TaskStatus] = parseInt(row.count, 10);
        }
      });

      console.log(`[TasksService] Counts for user ${userId}:`, statusCounts);
      return statusCounts;
    } catch (error) {
      console.error(
        `[TasksService] Error calculating task counts for user ${userId}:`,
        error,
      );
      throw new Error(
        `Failed to calculate task counts for user: ${error.message}`,
      );
    }
  }

  // END: NEW Methods for Aggregated Status Counts

  // NEW Helper method to get all relevant assignees for a notification
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
}
