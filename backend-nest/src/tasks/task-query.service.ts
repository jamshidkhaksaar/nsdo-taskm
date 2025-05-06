import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  Logger,
  Inject,
  forwardRef,
  ForbiddenException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, In, Not, Between } from "typeorm";
import { Task, TaskStatus, TaskType } from "./entities/task.entity";
import { User } from "../users/entities/user.entity";
import { Department } from "../departments/entities/department.entity";
import { Province } from "../provinces/entities/province.entity";
import { UsersService } from "../users/users.service";
import { RecycleBinQueryDto } from "./dto/recycle-bin-query.dto";
import { DashboardTasksResponse, TaskStatusCounts } from "./tasks.service"; // Import interfaces from original service for now

@Injectable()
export class TaskQueryService {
  private readonly logger = new Logger(TaskQueryService.name);

  constructor(
    @InjectRepository(Task)
    private tasksRepository: Repository<Task>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    // Inject UsersService if needed for helper methods like checkAssigneePermission
    @Inject(forwardRef(() => UsersService))
    private usersService: UsersService,
    // Add other repository injections if methods moved here require them
    // e.g., @InjectRepository(Department) private departmentsRepository: Repository<Department>,
  ) {}

  /**
   * Finds a single task by its ID, including relations needed for common operations and ownership checks.
   * @param id The ID of the task to find.
   * @param relations Optional array of additional relations to load.
   * @returns The found Task entity.
   * @throws NotFoundException if the task with the given ID is not found.
   */
  async findOne(id: string, relations: string[] = []): Promise<Task> {
    const defaultRelations = [
      "createdBy",
      "assignedToUsers",
      "assignedToDepartments",
      "assignedToProvince",
      "delegatedBy",
      "delegatedFromTask",
      "deletedBy", // Include deletedBy for recycle bin context
    ];
    const finalRelations = [ ...new Set([...defaultRelations, ...relations]) ];

    try {
      const task = await this.tasksRepository.findOne({
        where: { id },
        relations: finalRelations,
      });

      if (!task) {
        throw new NotFoundException(`Task with ID ${id} not found`);
      }
      return task;
    } catch (error) {
      this.logger.error(`Error finding task with ID ${id}: ${error.message}`, error.stack);
      if (error instanceof NotFoundException) throw error;
      // Avoid throwing InternalServerError for a simple not found case
      throw new NotFoundException(`Error fetching task with ID ${id}. Cause: ${error.message}`);
    }
  }

  // --- Moved Query Methods Will Go Here ---

  async findAll(query: any, user: any): Promise<Task[]> {
    // Initialize query builder
    const qb = this.tasksRepository.createQueryBuilder("task");

    // Basic filtering (example: by status)
    if (query.status) {
      qb.andWhere("task.status = :status", { status: query.status });
    }

    // --- Authorization Logic ---
    const userId = user.userId;
    const userRole = user.role; // Assuming role is passed in the user object

    const includeAll = false; // Placeholder until RBAC is fully integrated
    const includeAllParam = query.include_all === "true"; // Check for explicit request

    if (!(includeAll || includeAllParam)) {
      // Standard users/others only see tasks relevant to them
      const userEntity = await this.usersRepository.findOne({
        where: { id: userId },
        relations: ["departments"], // Need departments for condition 3
      });

      if (!userEntity) {
        throw new NotFoundException(`User with ID ${userId} not found.`);
      }

      const departmentIds = userEntity.departments.map((dept) => dept.id);

      qb.leftJoinAndSelect("task.assignedToUsers", "assignedUser")
        .leftJoinAndSelect("task.assignedToDepartments", "assignedDept")
        .where((subQb) => {
          subQb.where("task.createdById = :userId", { userId });
          subQb.orWhere("assignedUser.id = :userId", { userId });
          if (departmentIds.length > 0) {
            subQb.orWhere("assignedDept.id IN (:...departmentIds)", {
              departmentIds,
            });
          }
        });
    }

    if (query.includeDeleted !== "true") {
      qb.andWhere("task.deletedAt IS NULL");
    }

    qb.leftJoinAndSelect("task.createdBy", "creator")
      .leftJoinAndSelect("task.assignedToUsers", "assignees")
      .leftJoinAndSelect("task.assignedToDepartments", "departments")
      .leftJoinAndSelect("task.assignedToProvince", "province")
      .leftJoinAndSelect("task.delegatedFromTask", "parent")
      .leftJoinAndSelect("task.delegatedToTask", "children");

    if (query.sortBy) {
      const order = query.order?.toUpperCase() === "DESC" ? "DESC" : "ASC";
      qb.orderBy(`task.${query.sortBy}`, order);
    } else {
      qb.orderBy("task.createdAt", "DESC");
    }

    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 10;
    qb.skip((page - 1) * limit).take(limit);

    try {
      return await qb.getMany();
    } catch (error) {
      this.logger.error(`Failed to find tasks: ${error.message}`, error.stack);
      throw new InternalServerErrorException("Failed to retrieve tasks.");
    }
  }

  // Helper to check if a user is considered an assignee (direct, via department, or via province/department)
  // Made public for now, could be private if only used internally
  async checkAssigneePermission(task: Task, userId: string): Promise<boolean> {
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
      // Use UsersService to get user with departments
      const userWithDepartments = await this.usersService.findById(userId);
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
      // Use UsersService to get user with departments
      const userWithDepartments = await this.usersService.findById(userId);
      if (!userWithDepartments || !userWithDepartments.departments)
        return false;

      // Filter user's departments to only those belonging to the task's province
      const userDepartmentIdsInProvince = userWithDepartments.departments
        .filter((dept) => dept.provinceId === task.assignedToProvinceId)
        .map((dept) => dept.id);

      if (userDepartmentIdsInProvince.length === 0) return false;

      const taskDepartmentIds = task.assignedToDepartments.map(
        (dept) => dept.id,
      );

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

  async findAllDeleted(
    query: RecycleBinQueryDto,
    reqUser: any,
  ): Promise<[Task[], number]> {
    this.logger.log(
      `Fetching deleted tasks for user ${reqUser.userId} (${reqUser.role?.name}) with query:`,
      query,
    );
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

    const queryBuilder = this.tasksRepository
      .createQueryBuilder("task")
      .leftJoinAndSelect("task.createdBy", "createdBy")
      .leftJoinAndSelect("task.deletedBy", "deletedBy")
      .leftJoinAndSelect("task.assignedToUsers", "assignedToUsers")
      .leftJoinAndSelect("task.assignedToDepartments", "assignedToDepartments")
      .leftJoinAndSelect("task.assignedToProvince", "assignedToProvince")
      .where("task.isDeleted = :isDeleted", { isDeleted: true });

    if (query.search) {
      queryBuilder.andWhere(
        "(task.title LIKE :search OR task.description LIKE :search OR task.deletionReason LIKE :search)",
        { search: `%${query.search}%` },
      );
    }
    if (query.userId) {
      queryBuilder.andWhere("task.createdById = :userId", {
        userId: query.userId,
      });
    }
    if (query.departmentId) {
      queryBuilder.andWhere("assignedToDepartments.id = :departmentId", {
        departmentId: query.departmentId,
      });
    }
    if (query.provinceId) {
      queryBuilder.andWhere(
        "(task.assignedToProvinceId = :provinceId OR assignedToDepartments.provinceId = :provinceId)",
        { provinceId: query.provinceId },
      );
    }
    if (query.deletedByUserId) {
      queryBuilder.andWhere("task.deletedById = :deletedByUserId", {
        deletedByUserId: query.deletedByUserId,
      });
    }
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

    const sortBy = query.sortBy || "deletedAt";
    const sortOrder = query.sortOrder || "DESC";
    queryBuilder.orderBy(`task.${sortBy}`, sortOrder);

    const page = query.page ? parseInt(query.page, 10) : 1;
    const limit = query.limit ? parseInt(query.limit, 10) : 10;
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    const [tasks, total] = await queryBuilder.getManyAndCount();
    return [tasks, total];
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
        `[TaskQueryService] Dashboard data lengths: Personal=${response.myPersonalTasks.length}, Created=${response.tasksICreatedForOthers.length}, Assigned=${response.tasksAssignedToMe.length}, DeptTasks=${response.tasksAssignedToMyDepartments.length}, DelegatedBy=${response.tasksDelegatedByMe.length}, DelegatedTo=${response.tasksDelegatedToMe.length}`,
      );

      return response;
    } catch (error) {
      this.logger.error(
        `[TaskQueryService] Error fetching dashboard tasks for user ${userId}:`,
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

  async getMyPersonalTasks(userId: string): Promise<Task[]> {
    this.logger.log(`Fetching personal tasks for user ${userId}`);
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
      this.logger.error(
        `Error fetching personal tasks for user ${userId}:`,
        error,
      );
      throw new Error(`Failed to fetch personal tasks: ${error.message}`);
    }
  }

  async getTasksAssignedToUserExplicitly(userId: string): Promise<Task[]> {
    this.logger.log(
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
      this.logger.error(
        `Error fetching non-personal tasks assigned to user ${userId}:`,
        error,
      );
      throw new Error(
        `Failed to fetch assigned non-personal tasks: ${error.message}`,
      );
    }
  }

  async getTasksCreatedByUserForOthers(userId: string): Promise<Task[]> {
    this.logger.log(
      `Fetching tasks created by user ${userId} for others (non-personal)`,
    );
    try {
      return await this.tasksRepository.find({
        where: {
          createdById: userId,
          type: Not(TaskType.PERSONAL),
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
      this.logger.error(
        `Error fetching non-personal tasks created by user ${userId}:`,
        error,
      );
      throw new Error(
        `Failed to fetch created non-personal tasks: ${error.message}`,
      );
    }
  }

  async getTasksForDepartments(departmentIds: string[]): Promise<Task[]> {
    if (!departmentIds || departmentIds.length === 0) {
      return [];
    }
    this.logger.log(
      `[TaskQueryService] Fetching tasks for departments: ${departmentIds.join(", ")}`,
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
        )
        .orderBy("task.createdAt", "DESC")
        .getMany();
    } catch (error) {
      this.logger.error(
        `[TaskQueryService] Error fetching tasks for departments ${departmentIds.join(", ")}:`,
        error,
      );
      return [];
    }
  }

  async getTasksAssignedToUser(userId: string): Promise<Task[]> {
    this.logger.log(`Fetching tasks assigned directly to user ${userId}`);
    try {
      return await this.tasksRepository
        .createQueryBuilder("task")
        .innerJoin("task.assignedToUsers", "user")
        .where("user.id = :userId", { userId })
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
      this.logger.error(
        `Error fetching tasks assigned to user ${userId}:`,
        error,
      );
      throw new Error(`Failed to fetch assigned tasks: ${error.message}`);
    }
  }

  async getTasksCreatedByUser(userId: string): Promise<Task[]> {
    this.logger.log(`Fetching tasks created by user ${userId}`);
    try {
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
      this.logger.error(
        `Error fetching tasks created by user ${userId}:`,
        error,
      );
      throw new Error(`Failed to fetch created tasks: ${error.message}`);
    }
  }

  async getTasksDelegatedByUser(userId: string): Promise<Task[]> {
    this.logger.log(`Fetching tasks delegated by user ${userId}`);
    try {
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
      this.logger.error(
        `Error fetching tasks delegated by user ${userId}:`,
        error,
      );
      throw new Error(
        `Failed to fetch tasks delegated by user: ${error.message}`,
      );
    }
  }

  async getTasksDelegatedToUser(userId: string): Promise<Task[]> {
    this.logger.log(`Fetching tasks delegated to user ${userId}`);
    try {
      return await this.tasksRepository
        .createQueryBuilder("task")
        .innerJoin("task.assignedToUsers", "user")
        .where("user.id = :userId", { userId })
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
      this.logger.error(
        `Error fetching tasks delegated to user ${userId}:`,
        error,
      );
      throw new Error(
        `Failed to fetch tasks delegated to user: ${error.message}`,
      );
    }
  }

  async getTasksForDepartment(departmentId: string): Promise<Task[]> {
    this.logger.log(`Fetching tasks for department ${departmentId}`);
    try {
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
      this.logger.error(
        `Error fetching tasks for department ${departmentId}:`,
        error,
      );
      if (error instanceof NotFoundException) throw error;
      throw new Error(
        `Failed to fetch tasks for department ${departmentId}: ${error.message}`,
      );
    }
  }

  async getTasksForUser(userId: string): Promise<Task[]> {
    this.logger.log(`Fetching tasks assigned to user ${userId}`);
    try {
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
      this.logger.error(`Error fetching tasks for user ${userId}:`, error);
      if (error instanceof NotFoundException) throw error;
      throw new Error(
        `Failed to fetch tasks for user ${userId}: ${error.message}`,
      );
    }
  }

  async getTasksForProvince(provinceId: string): Promise<Task[]> {
    this.logger.log(`Fetching tasks for province ${provinceId}`);
    try {
      return await this.tasksRepository.find({
        where: [
          { assignedToProvinceId: provinceId },
          { assignedToDepartments: { provinceId: provinceId } },
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
      this.logger.error(
        `Error fetching tasks for province ${provinceId}:`,
        error,
      );
      if (error instanceof NotFoundException) throw error;
      throw new Error(
        `Failed to fetch tasks for province ${provinceId}: ${error.message}`,
      );
    }
  }

  async getTaskCountsByStatusForDepartment(
    departmentId: string,
  ): Promise<TaskStatusCounts> {
    this.logger.log(
      `[TaskQueryService] Calculating task counts by status for department ${departmentId}`,
    );
    try {
      const counts = await this.tasksRepository
        .createQueryBuilder("task")
        .select("task.status", "status")
        .addSelect("COUNT(task.id)", "count")
        .innerJoin("task.assignedToDepartments", "department")
        .where("department.id = :departmentId", { departmentId })
        .groupBy("task.status")
        .getRawMany();

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

      this.logger.log(
        `[TaskQueryService] Counts for department ${departmentId}:`,
        statusCounts,
      );
      return statusCounts;
    } catch (error) {
      this.logger.error(
        `[TaskQueryService] Error calculating task counts for department ${departmentId}:`,
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
    this.logger.log(
      `[TaskQueryService] Calculating task counts by status for user ${userId}`,
    );
    try {
      const counts = await this.tasksRepository
        .createQueryBuilder("task")
        .select("task.status", "status")
        .addSelect("COUNT(task.id)", "count")
        .innerJoin("task.assignedToUsers", "user")
        .where("user.id = :userId", { userId })
        .groupBy("task.status")
        .getRawMany();

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

      this.logger.log(
        `[TaskQueryService] Counts for user ${userId}:`,
        statusCounts,
      );
      return statusCounts;
    } catch (error) {
      this.logger.error(
        `[TaskQueryService] Error calculating task counts for user ${userId}:`,
        error,
      );
      throw new Error(
        `Failed to calculate task counts for user: ${error.message}`,
      );
    }
  }
}
