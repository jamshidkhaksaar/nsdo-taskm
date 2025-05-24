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
import { Repository, In, Not, Between, IsNull } from "typeorm";
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
    @InjectRepository(Department)
    private readonly departmentsRepository: Repository<Department>,
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
      "createdBy.departments",
      "assignedToUsers",
      "assignedToUsers.departments",
      "assignedToDepartments",
      "assignedToProvince",
      "delegatedBy",
      "delegatedBy.departments",
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

    // Join and select createdBy and assignedToUsers, ensuring they are not soft-deleted
    // If a task was created by or assigned to a user who is now soft-deleted,
    // these relations might not populate or would need careful handling based on desired UX.
    // For now, we assume relations should point to non-deleted users if they are to be actively displayed.
    qb.leftJoinAndSelect("task.createdBy", "creator", "creator.deletedAt IS NULL")
      .leftJoinAndSelect("task.assignedToUsers", "assignees", "assignees.deletedAt IS NULL")
      .leftJoinAndSelect("task.assignedToDepartments", "departments") // Departments don't have soft delete in this context
      .leftJoinAndSelect("task.assignedToProvince", "province")
      .leftJoinAndSelect("task.delegatedFromTask", "parent")
      .leftJoinAndSelect("task.delegatedToTask", "children")
      .leftJoinAndSelect("task.delegatedBy", "delegatedByUser", "delegatedByUser.deletedAt IS NULL");

    // Basic filtering (example: by status)
    if (query.status) {
      qb.andWhere("task.status = :status", { status: query.status });
    }
    if (query.department_id) {
      qb.innerJoin("task.assignedToDepartments", "departmentFilter", "departmentFilter.id = :deptIdToFilter", { deptIdToFilter: query.department_id });
    }

    // --- Authorization Logic ---
    const userId = user.userId; // Assuming this is the ID string
    const userRoleName = user.role?.name?.toLowerCase(); // Get role name, lowercase for case-insensitive comparison

    let includeAll = false;
    if (userRoleName && ['admin', 'leadership'].includes(userRoleName)) {
      includeAll = true;
    }
    
    // Allow explicit query param to override role-based includeAll, mainly for testing or specific non-admin 'view all' scenarios
    const includeAllParam = query.include_all === "true";
    if (includeAllParam) {
        includeAll = true; // If param is true, always include all
    } else if (query.include_all === "false") {
        includeAll = false; // If param is explicitly false, force normal filtering even for admin
    }

    if (!includeAll) { // If not including all (either by role or by param)
      const userEntity = await this.usersRepository.findOne({
        where: { id: userId, deletedAt: IsNull() }, // Ensure the requesting user is not soft-deleted
        relations: ["departments"], // Need departments for condition 3
      });

      if (!userEntity) {
        throw new NotFoundException(`User with ID ${userId} not found.`);
      }

      const departmentIds = userEntity.departments.map((dept) => dept.id);

      qb.leftJoinAndSelect("task.assignedToUsers", "assignedUser") // Re-alias to avoid conflict if already joined, or ensure distinct
        .leftJoinAndSelect("task.assignedToDepartments", "assignedDept")
        .where((subQb) => {
          subQb.where("task.createdById = :userId", { userId }); // userId here is of the non-deleted userEntity
          subQb.orWhere("assignedUser.id = :userId AND assignedUser.deletedAt IS NULL", { userId }); // Also check assignedUser is not deleted
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
  async checkAssigneePermission(task: Task, userId: string, userWithDepartments?: User): Promise<boolean> {
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
      const userForCheck = userWithDepartments || await this.usersService.findById(userId, ["departments"]);
      if (!userForCheck || !userForCheck.departments)
        return false;

      const userDepartmentIds = userForCheck.departments.map(
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
      const userForCheck = userWithDepartments || await this.usersService.findById(userId, ["departments"]);
      if (!userForCheck || !userForCheck.departments)
        return false;

      // Filter user's departments to only those belonging to the task's province
      const userDepartmentIdsInProvince = userForCheck.departments
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

  async isUserInAssignedDepartments(userId: string, assignedDepartments: Department[]): Promise<boolean> {
    if (!assignedDepartments || assignedDepartments.length === 0) {
      return false;
    }
    const user = await this.usersService.findById(userId, ["departments"]);
    if (!user || !user.departments || user.departments.length === 0) {
      return false;
    }
    const userDepartmentIds = user.departments.map(dept => dept.id);
    const taskDepartmentIds = assignedDepartments.map(dept => dept.id);

    return taskDepartmentIds.some(taskDeptId => userDepartmentIds.includes(taskDeptId));
  }

  async findAllDeleted(
    query: RecycleBinQueryDto,
    reqUser: any,
  ): Promise<[Task[], number]> {
    this.logger.log(
      `Fetching deleted tasks for user ${reqUser.userId} (${reqUser.role?.name}) with query:`,
      JSON.stringify(query, null, 2), // Pretty print query
    );
    const userRoleName = reqUser.role?.name?.toUpperCase(); // Normalize to uppercase
    const isAdminOrLeadership = ["ADMIN", "LEADERSHIP"].includes(
      userRoleName,
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
    if (query.userId) { // This likely refers to createdById based on DTO
      queryBuilder.andWhere("task.createdById = :createdById", {
        createdById: query.userId,
      });
    }
    if (query.departmentId) {
      // Ensure this join doesn't cause issues if assignedToDepartments is empty for some tasks
      // This condition implies that the task must be assigned to this specific department.
      queryBuilder.andWhere("assignedToDepartments.id = :departmentId", {
        departmentId: query.departmentId,
      });
    }
    if (query.provinceId) {
      // This condition means the task is either directly assigned to the province
      // OR assigned to a department that belongs to this province.
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
    
    // Validate sortBy to prevent SQL injection if it's user-provided and not from a fixed list
    const allowedSortByFields = [
      "id", "title", "status", "priority", "type", "dueDate", 
      "createdAt", "updatedAt", "deletedAt", "deletionReason"
      // Add more fields if sorting by relational properties is needed, e.g., "createdBy.username"
      // This requires careful handling of aliases in queryBuilder.orderBy
    ];

    if (allowedSortByFields.includes(sortBy)) {
        queryBuilder.orderBy(`task.${sortBy}`, sortOrder as "ASC" | "DESC");
    } else {
        this.logger.warn(`Invalid sortBy field used: '${sortBy}'. Defaulting to 'task.deletedAt'.`);
        queryBuilder.orderBy(`task.deletedAt`, sortOrder as "ASC" | "DESC"); // Default and safe sort field
    }

    // Use number directly, applying default if undefined or null
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    
    // Ensure page and limit are positive integers
    const safePage = Math.max(1, Math.floor(page));
    const safeLimit = Math.max(1, Math.floor(limit));

    queryBuilder.skip((safePage - 1) * safeLimit).take(safeLimit);

    try {
      // Log the generated SQL for inspection
      const sql = queryBuilder.getSql();
      this.logger.debug(`[findAllDeleted] Generated SQL: ${sql}`);
      
      const [tasks, total] = await queryBuilder.getManyAndCount();
      
      // Log the tasks that are about to be returned, especially if any look suspicious
      this.logger.debug(`[findAllDeleted] Tasks to be returned (first few): ${JSON.stringify(tasks.slice(0, 3), null, 2)}`);
      if (tasks.some(t => typeof t !== 'object' || t === null || !t.id)) {
          this.logger.error('[findAllDeleted] CRITICAL: Some items in tasks array are not valid task objects or are missing IDs before returning!');
          // Optional: Filter out bad data as a last resort if root cause is hard to find immediately.
          // const validTasks = tasks.filter(t => typeof t === 'object' && t !== null && t.id);
          // if (validTasks.length !== tasks.length) {
          //   this.logger.warn(`[findAllDeleted] Filtered out ${tasks.length - validTasks.length} invalid items from results.`);
          //   return [validTasks, validTasks.length]; // Note: 'total' might become inaccurate if filtering here.
          // }
      }

      return [tasks, total];
    } catch (error) {
      this.logger.error(
        `Error fetching deleted tasks: ${error.message}`,
        error.stack,
      );
      // Log the failing SQL if available in the error object
      // TypeORM errors often include 'query' and 'parameters' properties
      if (error.query) {
          this.logger.error(`Failing SQL: ${error.query}`);
      }
      if (error.parameters) {
          this.logger.error(`SQL Parameters: ${JSON.stringify(error.parameters)}`);
      }
      throw new InternalServerErrorException("Failed to retrieve deleted tasks.");
    }
  }

  async getDashboardTasks(requestingUser: User): Promise<DashboardTasksResponse> {
    try {
      // User object is now passed directly
      const userId = requestingUser.id;
      const userRole = requestingUser.role?.name; // Assuming role is populated

      if (!requestingUser) { // Should not happen if JwtAuthGuard is effective
        throw new NotFoundException(`Requesting user not found.`);
      }

      const departmentIds = requestingUser.departments
        ? requestingUser.departments.map((d) => d.id)
        : [];

      const myPersonalTasks = await this.getMyPersonalTasks(userId, userRole);
      const tasksICreatedForOthers =
        await this.getTasksCreatedByUserForOthers(userId, userRole);
      const tasksAssignedToMe =
        await this.getTasksAssignedToUserExplicitly(userId, userRole);
      
      // For department tasks, only get tasks assigned directly to departments (not individual users)
      const tasksAssignedToMyDepartments = userRole === 'admin'
        ? await this.getAllTasksAssignedToDepartmentsOnly()
        : await this.getTasksAssignedToMyDepartmentsOnly(departmentIds);

      const tasksDelegatedByMe = await this.getTasksDelegatedByUser(userId, userRole);
      const tasksDelegatedToMe = await this.getTasksDelegatedToUser(userId, userRole);

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
        `[TaskQueryService] Error fetching dashboard tasks for user ${requestingUser.id}:`,
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

  async getMyPersonalTasks(userId: string, userRole?: string): Promise<Task[]> {
    this.logger.log(`Fetching personal tasks for user ${userId}${userRole ? ` (Role: ${userRole})` : ''}`);
    try {
      const whereClause: any = {
        type: TaskType.PERSONAL,
        isDelegated: false,
        isDeleted: false, // Added to ensure only non-deleted tasks
      };

      if (userRole !== 'admin') {
        whereClause.createdById = userId;
      }
      // If admin, createdById is omitted

      return await this.tasksRepository.find({
        where: whereClause,
        relations: [
          "assignedToUsers",
          "assignedToUsers.departments",
          "assignedToDepartments",
          "assignedToProvince",
          "delegatedBy",
          "delegatedBy.departments",
          "createdBy",
          "createdBy.departments",
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

  async getTasksAssignedToUserExplicitly(userId: string, userRole?: string): Promise<Task[]> {
    this.logger.log(
      `Fetching tasks assigned explicitly to user ${userId}${userRole ? ` (Role: ${userRole})` : ''}`,
    );
    try {
      const qb = this.tasksRepository
        .createQueryBuilder("task")
        .leftJoinAndSelect("task.createdBy", "createdBy", "createdBy.deletedAt IS NULL")
        .leftJoinAndSelect("createdBy.departments", "createdByDepartments")
        .leftJoinAndSelect("task.assignedToUsers", "assignee", "assignee.deletedAt IS NULL")
        .leftJoinAndSelect("assignee.departments", "assigneeDepartments")
        .leftJoinAndSelect("task.assignedToDepartments", "assignedToDepartments")
        .leftJoinAndSelect("task.assignedToProvince", "assignedToProvince")
        .leftJoinAndSelect("task.delegatedBy", "delegatedBy", "delegatedBy.deletedAt IS NULL")
        .leftJoinAndSelect("delegatedBy.departments", "delegatedByDepartments")
        .where("task.type != :personalType", { personalType: TaskType.PERSONAL })
        .andWhere("task.isDelegated = :isDelegated", { isDelegated: false })
        .andWhere("task.isDeleted = :isDeleted", { isDeleted: false }); // Added

      if (userRole !== 'admin') {
        qb.andWhere("assignee.id = :userId", { userId });
      }
      // If admin, the assignee.id = :userId condition is omitted

      return await qb.orderBy("task.createdAt", "DESC").getMany();
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

  async getTasksCreatedByUserForOthers(userId: string, userRole?: string): Promise<Task[]> {
    this.logger.log(
      `Fetching tasks created by user ${userId} for others${userRole ? ` (Role: ${userRole})` : ''}`,
    );
    try {
      const whereClause: any = {
        type: Not(TaskType.PERSONAL),
        isDelegated: false,
        isDeleted: false, // Added
      };

      if (userRole !== 'admin') {
        whereClause.createdById = userId;
      }
      // If admin, createdById is omitted

      return await this.tasksRepository.find({
        where: whereClause,
        relations: [
          "assignedToUsers",
          "assignedToUsers.departments",
          "assignedToDepartments",
          "assignedToProvince",
          "delegatedBy",
          "delegatedBy.departments",
          "createdBy",
          "createdBy.departments",
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
    this.logger.log(`Fetching tasks for departments: ${departmentIds.join(", ")}`);
    try {
      // Get tasks assigned directly to departments OR assigned to users who are members of these departments
      return await this.tasksRepository
        .createQueryBuilder("task")
        .leftJoinAndSelect("task.createdBy", "createdBy", "createdBy.deletedAt IS NULL")
        .leftJoinAndSelect("createdBy.departments", "createdByDepartments")
        .leftJoinAndSelect("task.assignedToUsers", "assignedToUsers", "assignedToUsers.deletedAt IS NULL")
        .leftJoinAndSelect("assignedToUsers.departments", "assignedToUsersDepartments")
        .leftJoinAndSelect("task.assignedToDepartments", "assignedToDepartments")
        .leftJoinAndSelect("task.assignedToProvince", "assignedToProvince")
        .leftJoinAndSelect("task.delegatedBy", "delegatedBy", "delegatedBy.deletedAt IS NULL")
        .leftJoinAndSelect("delegatedBy.departments", "delegatedByDepartments")
        .leftJoin("assignedToUsers.departments", "userDepartments")
        .where(
          "assignedToDepartments.id IN (:...departmentIds) OR userDepartments.id IN (:...departmentIds)",
          { departmentIds }
        )
        .andWhere("task.isDelegated = :isDelegated", { isDelegated: false })
        .andWhere("task.isDeleted = :isDeleted", { isDeleted: false })
        .orderBy("task.createdAt", "DESC")
        .getMany();
    } catch (error) {
      this.logger.error(
        `Error fetching tasks for departments ${departmentIds.join(", ")}:`,
        error,
      );
      throw new Error(`Failed to fetch department tasks: ${error.message}`);
    }
  }

  async getTasksAssignedToMyDepartmentsOnly(departmentIds: string[]): Promise<Task[]> {
    if (!departmentIds || departmentIds.length === 0) {
      return [];
    }
    this.logger.log(`Fetching tasks assigned ONLY to departments: ${departmentIds.join(", ")}`);
    try {
      // Get tasks assigned ONLY directly to departments (not to individual users within those departments)
      return await this.tasksRepository
        .createQueryBuilder("task")
        .leftJoinAndSelect("task.createdBy", "createdBy", "createdBy.deletedAt IS NULL")
        .leftJoinAndSelect("createdBy.departments", "createdByDepartments")
        .leftJoinAndSelect("task.assignedToUsers", "assignedToUsers", "assignedToUsers.deletedAt IS NULL")
        .leftJoinAndSelect("assignedToUsers.departments", "assignedToUsersDepartments")
        .leftJoinAndSelect("task.assignedToDepartments", "assignedToDepartments")
        .leftJoinAndSelect("task.assignedToProvince", "assignedToProvince")
        .leftJoinAndSelect("task.delegatedBy", "delegatedBy", "delegatedBy.deletedAt IS NULL")
        .leftJoinAndSelect("delegatedBy.departments", "delegatedByDepartments")
        .where("assignedToDepartments.id IN (:...departmentIds)", { departmentIds })
        .andWhere("task.isDelegated = :isDelegated", { isDelegated: false })
        .andWhere("task.isDeleted = :isDeleted", { isDeleted: false })
        .orderBy("task.createdAt", "DESC")
        .getMany();
    } catch (error) {
      this.logger.error(
        `Error fetching tasks assigned only to departments ${departmentIds.join(", ")}:`,
        error,
      );
      throw new Error(`Failed to fetch department-only tasks: ${error.message}`);
    }
  }

  async getAllDepartmentTasks(): Promise<Task[]> {
    this.logger.log(`Fetching all tasks assigned to any department (admin)`);
    try {
      // Get all tasks assigned to departments OR assigned to users who are members of any department
      return await this.tasksRepository
        .createQueryBuilder("task")
        .leftJoinAndSelect("task.createdBy", "createdBy", "createdBy.deletedAt IS NULL")
        .leftJoinAndSelect("createdBy.departments", "createdByDepartments")
        .leftJoinAndSelect("task.assignedToUsers", "assignedToUsers", "assignedToUsers.deletedAt IS NULL")
        .leftJoinAndSelect("assignedToUsers.departments", "assignedToUsersDepartments")
        .leftJoinAndSelect("task.assignedToDepartments", "assignedToDepartments")
        .leftJoinAndSelect("task.assignedToProvince", "assignedToProvince")
        .leftJoinAndSelect("task.delegatedBy", "delegatedBy", "delegatedBy.deletedAt IS NULL")
        .leftJoinAndSelect("delegatedBy.departments", "delegatedByDepartments")
        .leftJoin("assignedToUsers.departments", "userDepartments")
        .where("assignedToDepartments.id IS NOT NULL OR userDepartments.id IS NOT NULL")
        .andWhere("task.isDelegated = :isDelegated", { isDelegated: false })
        .andWhere("task.isDeleted = :isDeleted", { isDeleted: false })
        .orderBy("task.createdAt", "DESC")
        .getMany();
    } catch (error) {
      this.logger.error(
        `Error fetching all department tasks for admin:`,
        error,
      );
      throw new Error(`Failed to fetch all department tasks: ${error.message}`);
    }
  }

  async getAllTasksAssignedToDepartmentsOnly(): Promise<Task[]> {
    this.logger.log(`Fetching all tasks assigned ONLY to departments (admin)`);
    try {
      // Get all tasks assigned ONLY directly to departments (not to individual users within departments)
      return await this.tasksRepository
        .createQueryBuilder("task")
        .leftJoinAndSelect("task.createdBy", "createdBy", "createdBy.deletedAt IS NULL")
        .leftJoinAndSelect("createdBy.departments", "createdByDepartments")
        .leftJoinAndSelect("task.assignedToUsers", "assignedToUsers", "assignedToUsers.deletedAt IS NULL")
        .leftJoinAndSelect("assignedToUsers.departments", "assignedToUsersDepartments")
        .leftJoinAndSelect("task.assignedToDepartments", "assignedToDepartments")
        .leftJoinAndSelect("task.assignedToProvince", "assignedToProvince")
        .leftJoinAndSelect("task.delegatedBy", "delegatedBy", "delegatedBy.deletedAt IS NULL")
        .leftJoinAndSelect("delegatedBy.departments", "delegatedByDepartments")
        .where("assignedToDepartments.id IS NOT NULL")
        .andWhere("task.isDelegated = :isDelegated", { isDelegated: false })
        .andWhere("task.isDeleted = :isDeleted", { isDeleted: false })
        .orderBy("task.createdAt", "DESC")
        .getMany();
    } catch (error) {
      this.logger.error(
        `Error fetching all department-only tasks for admin:`,
        error,
      );
      throw new Error(`Failed to fetch all department-only tasks: ${error.message}`);
    }
  }

  async getTasksDelegatedByUser(userId: string, userRole?: string): Promise<Task[]> {
    this.logger.log(`Fetching tasks delegated by user ${userId}${userRole ? ` (Role: ${userRole})` : ''}`);
    try {
      const whereClause: any = {
        isDelegated: true,
        isDeleted: false, // Added
      };

      if (userRole !== 'admin') {
        whereClause.delegatedByUserId = userId;
      }
      // If admin, delegatedByUserId is omitted

      return await this.tasksRepository.find({
        where: whereClause,
        relations: [
          "createdBy",
          "createdBy.departments",
          "assignedToUsers",
          "assignedToUsers.departments",
          "assignedToDepartments",
          "assignedToProvince",
          "delegatedBy",
          "delegatedBy.departments",
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

  async getTasksDelegatedToUser(userId: string, userRole?: string): Promise<Task[]> {
    this.logger.log(`Fetching tasks delegated to user ${userId}${userRole ? ` (Role: ${userRole})` : ''}`);
    try {
      const qb = this.tasksRepository
        .createQueryBuilder("task")
        .innerJoin("task.assignedToUsers", "assignee", "assignee.deletedAt IS NULL")
        .where("task.isDelegated = :isDelegated", { isDelegated: true })
        .andWhere("task.isDeleted = :isDeleted", { isDeleted: false }); // Added
        // For delegated tasks, the assignee is the one it's delegated TO.

      if (userRole !== 'admin') {
        qb.andWhere("assignee.id = :userId", { userId });
      }
      // If admin, assignee.id = :userId is omitted

      qb.leftJoinAndSelect("task.createdBy", "createdBy", "createdBy.deletedAt IS NULL")
        .leftJoinAndSelect("createdBy.departments", "createdByDepartments")
        .leftJoinAndSelect("task.assignedToDepartments", "assignedToDepartments")
        .leftJoinAndSelect("task.assignedToProvince", "assignedToProvince")
        .leftJoinAndSelect("task.delegatedBy", "delegatedBy", "delegatedBy.deletedAt IS NULL")
        .leftJoinAndSelect("delegatedBy.departments", "delegatedByDepartments")
        .leftJoinAndSelect("task.delegatedFromTask", "delegatedFromTask")
        .orderBy("task.createdAt", "DESC");

      return await qb.getMany();
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

  async getTaskCountsByStatusForDepartment(
    departmentId: string,
  ): Promise<TaskStatusCounts> {
    this.logger.log(
      `[TaskQueryService] Calculating task counts by status for department ${departmentId}`,
    );
    try {
      // Count tasks assigned directly to department OR assigned to users who are members of this department
      const counts = await this.tasksRepository
        .createQueryBuilder("task")
        .select("task.status", "status")
        .addSelect("COUNT(DISTINCT task.id)", "count") // Use DISTINCT to avoid double counting
        .leftJoin("task.assignedToDepartments", "assignedToDepartments")
        .leftJoin("task.assignedToUsers", "assignedToUsers")
        .leftJoin("assignedToUsers.departments", "userDepartments")
        .where(
          "assignedToDepartments.id = :departmentId OR userDepartments.id = :departmentId",
          { departmentId }
        )
        .andWhere("task.isDelegated = :isDelegated", { isDelegated: false })
        .andWhere("task.isDeleted = :isDeleted", { isDeleted: false })
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
        .innerJoin("task.assignedToUsers", "user", "user.deletedAt IS NULL") // Ensure joined user is not soft-deleted
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

  async getTasksCreatedByUser(userId: string): Promise<Task[]> {
    this.logger.debug(`Fetching tasks created by user ID: ${userId}`);
    if (!userId) {
      this.logger.warn("[TaskQueryService] getTasksCreatedByUser called with no userId.");
      return [];
    }
    try {
      const tasks = await this.tasksRepository.find({
        where: { createdById: userId, deletedAt: IsNull() }, // Ensure not soft-deleted
        relations: [
          "assignedToUsers",
          "assignedToUsers.departments",
          "assignedToDepartments",
          "assignedToProvince",
          "delegatedFromTask",
          "delegatedBy",
          "delegatedBy.departments",
          "createdBy", // Though we filter by createdById, including it for consistency
          "createdBy.departments",
        ],
        order: { createdAt: "DESC" },
      });
      this.logger.log(`Found ${tasks.length} tasks created by user ${userId}`);
      return tasks;
    } catch (error) {
      this.logger.error(`Error fetching tasks created by user ${userId}: ${error.message}`, error.stack);
      throw new InternalServerErrorException(`Could not retrieve tasks created by user ${userId}: ${error.message}`);
    }
  }

  async getTasksForProvince(provinceId: string): Promise<Task[]> {
    this.logger.debug(`Fetching tasks for province ID: ${provinceId}`);
    if (!provinceId) {
      this.logger.warn("[TaskQueryService] getTasksForProvince called with no provinceId.");
      return [];
    }
    try {
      const tasks = await this.tasksRepository.find({
        where: { assignedToProvinceId: provinceId, deletedAt: IsNull() },
        relations: [
          "assignedToUsers",
          "assignedToDepartments",
          "assignedToProvince",
          "delegatedFromTask",
          "delegatedBy",
          "createdBy",
        ],
        order: { createdAt: "DESC" },
      });
      this.logger.log(`Found ${tasks.length} tasks for province ${provinceId}`);
      return tasks;
    } catch (error) {
      this.logger.error(`Error fetching tasks for province ${provinceId}: ${error.message}`, error.stack);
      throw new InternalServerErrorException(`Could not retrieve tasks for province ${provinceId}: ${error.message}`);
    }
  }

  async getTasksAssignedToUser(userId: string): Promise<Task[]> {
    this.logger.debug(`Fetching tasks directly assigned to user ID: ${userId}`);
    if (!userId) {
      this.logger.warn("[TaskQueryService] getTasksAssignedToUser called with no userId.");
      return [];
    }
    try {
      const tasks = await this.tasksRepository.createQueryBuilder("task")
        .leftJoinAndSelect("task.assignedToUsers", "assignee")
        .leftJoinAndSelect("assignee.departments", "assigneeDepartments")
        .leftJoinAndSelect("task.createdBy", "createdBy")
        .leftJoinAndSelect("createdBy.departments", "createdByDepartments")
        .leftJoinAndSelect("task.assignedToDepartments", "assignedToDepartments")
        .leftJoinAndSelect("task.assignedToProvince", "assignedToProvince")
        .leftJoinAndSelect("task.delegatedBy", "delegatedBy")
        .leftJoinAndSelect("delegatedBy.departments", "delegatedByDepartments")
        .leftJoinAndSelect("task.delegatedFromTask", "delegatedFromTask")
        .where("assignee.id = :userId", { userId })
        .andWhere("task.deletedAt IS NULL")
        .orderBy("task.createdAt", "DESC")
        .getMany();

      this.logger.log(`Found ${tasks.length} tasks assigned to user ${userId}`);
      return tasks;
    } catch (error) {
      this.logger.error(`Error fetching tasks assigned to user ${userId}: ${error.message}`, error.stack);
      throw new InternalServerErrorException(`Could not retrieve tasks assigned to user ${userId}: ${error.message}`);
    }
  }

  async getTasksForUser(userId: string): Promise<Task[]> {
    this.logger.debug(`Fetching all tasks related to user ID: ${userId}`);
    if (!userId) {
      this.logger.warn("[TaskQueryService] getTasksForUser called with no userId.");
      return [];
    }
    try {
      const tasks = await this.tasksRepository.createQueryBuilder("task")
        .leftJoinAndSelect("task.assignedToUsers", "assignee")
        .leftJoinAndSelect("assignee.departments", "assigneeDepartments")
        .leftJoinAndSelect("task.createdBy", "creator") // Alias for createdBy
        .leftJoinAndSelect("creator.departments", "creatorDepartments")
        .leftJoinAndSelect("task.assignedToDepartments", "assignedToDepartments")
        .leftJoinAndSelect("task.assignedToProvince", "assignedToProvince")
        .leftJoinAndSelect("task.delegatedBy", "delegatedBy")
        .leftJoinAndSelect("delegatedBy.departments", "delegatedByDepartments")
        .leftJoinAndSelect("task.delegatedFromTask", "delegatedFromTask")
        .where("(assignee.id = :userId OR creator.id = :userId)", { userId })
        .andWhere("task.deletedAt IS NULL")
        .orderBy("task.createdAt", "DESC")
        .getMany();

      this.logger.log(`Found ${tasks.length} tasks related to user ${userId}`);
      return tasks;
    } catch (error) {
      this.logger.error(`Error fetching tasks for user ${userId}: ${error.message}`, error.stack);
      throw new InternalServerErrorException(`Could not retrieve tasks for user ${userId}: ${error.message}`);
    }
  }
}
