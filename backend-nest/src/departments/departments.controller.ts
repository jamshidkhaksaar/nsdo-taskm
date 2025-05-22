import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Put,
  Post,
  UseGuards,
  Request,
  Inject,
  forwardRef,
  ForbiddenException,
  NotFoundException,
  Query,
  ParseUUIDPipe,
  Logger,
} from "@nestjs/common";
import { DepartmentsService } from "./departments.service";
import { CreateDepartmentDto } from "./dto/create-department.dto";
import { UpdateDepartmentDto } from "./dto/update-department.dto";
import { Department } from "./entities/department.entity";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { User } from "../users/entities/user.entity";
import { RolesGuard } from "../rbac/guards/roles.guard";
import { Roles } from "../rbac/decorators/roles.decorator";
import { ActivityLogService } from "../admin/services/activity-log.service";
import { TaskStatus, Task } from "../tasks/entities/task.entity";
import { TasksService } from "../tasks/tasks.service";
import { TaskQueryService } from "../tasks/task-query.service";
import { ApiOperation } from "@nestjs/swagger";

@Controller("departments")
@UseGuards(JwtAuthGuard, RolesGuard)
export class DepartmentsController {
  private readonly logger = new Logger(DepartmentsController.name);

  constructor(
    private departmentsService: DepartmentsService,
    @Inject(forwardRef(() => ActivityLogService))
    private activityLogService: ActivityLogService,
    private tasksService: TasksService,
    private taskQueryService: TaskQueryService,
  ) {}

  @Get()
  @Roles("User", "Leadership", "admin")
  async getAllDepartments(
    @Request() req,
    @Query("provinceId") provinceId?: string,
  ) {
    const departments = await this.departmentsService.findAll(provinceId);

    // Log the activity
    const logMessage = provinceId
      ? `Viewed departments filtered by province ID: ${provinceId}`
      : "Viewed all departments";
    await this.activityLogService.logFromRequest(
      req,
      "view",
      "departments",
      logMessage,
    );

    const formattedDepartments = await Promise.all(
      departments.map((department) =>
        this.formatDepartmentResponse(department),
      ),
    );
    return formattedDepartments;
  }

  @Get("/:id")
  @Roles("User", "Leadership", "admin")
  async getDepartmentById(@Param("id", ParseUUIDPipe) id: string, @Request() req) {
    const department = await this.departmentsService.findOne(id);

    // Log the activity
    await this.activityLogService.logFromRequest(
      req,
      "view",
      "department",
      `Viewed department: ${department.name}`,
      id,
    );

    // Apply the same formatting as getAllDepartments
    return await this.formatDepartmentResponse(department);
  }

  @Post()
  @Roles("Leadership", "admin")
  async createDepartment(
    @Body() createDepartmentDto: CreateDepartmentDto,
    @Request() req,
  ) {
    const department =
      await this.departmentsService.create(createDepartmentDto);

    // Log the activity
    await this.activityLogService.logFromRequest(
      req,
      "create",
      "department",
      `Created new department: ${department.name}`,
      department.id,
    );

    return await this.formatDepartmentResponse(department);
  }

  @Put("/:id")
  @Roles("Leadership", "admin")
  async updateDepartment(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() updateDepartmentDto: UpdateDepartmentDto,
    @Request() req,
  ) {
    const department = await this.departmentsService.update(
      id,
      updateDepartmentDto,
    );

    // Log the activity
    await this.activityLogService.logFromRequest(
      req,
      "update",
      "department",
      `Updated department: ${department.name}`,
      id,
    );

    return await this.formatDepartmentResponse(department);
  }

  @Delete("/:id")
  @Roles("Leadership", "admin")
  async deleteDepartment(@Param("id", ParseUUIDPipe) id: string, @Request() req) {
    const department = await this.departmentsService.findOne(id);

    // Log the activity before deletion
    await this.activityLogService.logFromRequest(
      req,
      "delete",
      "department",
      `Deleted department: ${department.name}`,
      id,
    );

    await this.departmentsService.remove(id);
    return { success: true, message: "Department deleted successfully" };
  }

  @Post("/:id/members/:userId")
  @Roles("Leadership", "admin")
  async addMember(
    @Param("id", ParseUUIDPipe) id: string,
    @Param("userId", ParseUUIDPipe) userId: string,
    @Request() req,
  ) {
    const department = await this.departmentsService.addMember(id, userId);

    // Log the activity
    await this.activityLogService.logFromRequest(
      req,
      "add",
      "department_member",
      `Added member to department: ${department.name}`,
      id,
    );

    return await this.formatDepartmentResponse(department);
  }

  @Delete("/:id/members/:userId")
  @Roles("Leadership", "admin")
  async removeMember(
    @Param("id", ParseUUIDPipe) id: string,
    @Param("userId", ParseUUIDPipe) userId: string,
    @Request() req,
  ) {
    const department = await this.departmentsService.removeMember(id, userId);

    // Log the activity
    await this.activityLogService.logFromRequest(
      req,
      "remove",
      "department_member",
      `Removed member from department: ${department.name}`,
      id,
    );

    return await this.formatDepartmentResponse(department);
  }

  @Get("/:id/tasks")
  @ApiOperation({ summary: "Get tasks for a specific department" })
  @Roles("Leadership", "admin")
  async getTasksForDepartment(@Param("id", ParseUUIDPipe) id: string, @Request() req) {
    // Use TaskQueryService
    const tasks = await this.taskQueryService.getTasksForDepartments([id]);

    // Log activity
    try {
      const department = await this.departmentsService.findOne(id); // Get name for logging
      await this.activityLogService.logFromRequest(
        req,
        "view",
        "department_tasks",
        `Viewed tasks for department: ${department.name}`,
        id,
      );
    } catch (logError) {
      this.logger.error(`Failed to log department task view activity: ${logError.message}`, logError.stack);
    }

    return tasks;
  }

  @Get("/:id/performance")
  @ApiOperation({ summary: "Get performance metrics for a department" })
  @Roles("Leadership", "admin")
  async getDepartmentPerformance(@Param("id", ParseUUIDPipe) id: string): Promise<any> {
    return this.departmentsService.getDepartmentPerformance(id);
  }

  @Get("/:id/members")
  @ApiOperation({ summary: "Get all members of a department" })
  @Roles("User", "Leadership", "admin")
  async getDepartmentMembers(
    @Param("id", ParseUUIDPipe) id: string,
    @Request() req,
  ): Promise<User[]> {
    const members = await this.departmentsService.getDepartmentMembers(id);

    // Log activity
    try {
      const department = await this.departmentsService.findOne(id); // Get name for logging
      await this.activityLogService.logFromRequest(
        req,
        "view",
        "department_members",
        `Viewed members for department: ${department.name}`,
        id,
      );
    } catch (logError) {
      this.logger.error(`Failed to log department member view activity: ${logError.message}`, logError.stack);
    }

    return members; // Return the user array directly
  }

  // Helper method to format department responses
  private async formatDepartmentResponse(department: Department) {
    if (!department) {
      this.logger.warn("[formatDepartmentResponse] Received null or undefined department object.");
      return null;
    }

    this.logger.debug(`Formatting department ${department.id}, headId: ${department.headId}`);

    let head_name = "No Head Assigned";
    if (department.head && department.head.username) {
      head_name = department.head.username;
    } else if (department.headId) {
      // Attempt to load head if only ID is present and head object wasn't populated by the service
      try {
        const headUser = await this.departmentsService.getUserById(department.headId);
        if (headUser) {
          head_name = headUser.username;
          // Optionally, assign to department.head if it helps other logic, but formatDepartmentResponse should be self-contained
          // department.head = headUser; 
        }
      } catch (error) {
        this.logger.error(`[formatDepartmentResponse] Error loading head user ${department.headId} for department ${department.id}: ${error.message}`);
      }
    }
    
    const members_count = department.members?.length || 0;
    const formattedMembers = department.members?.map(member => ({ 
        id: member.id, 
        username: member.username || "Unknown User"
        // avatar: member.avatarUrl // if you want to include avatar
    })) || [];

    // Initialize taskSummary with all expected keys from TaskStatus
    const defaultTaskSummary: { [K in TaskStatus | 'total']: number } = {
      total: 0,
      [TaskStatus.PENDING]: 0,
      [TaskStatus.IN_PROGRESS]: 0,
      [TaskStatus.COMPLETED]: 0,
      [TaskStatus.CANCELLED]: 0,
      [TaskStatus.DELEGATED]: 0,
      [TaskStatus.DELETED]: 0, // Ensure all statuses are covered
    };

    let finalTaskSummary = { ...defaultTaskSummary };

    try {
      if (department.id) {
        const summaryFromService = await this.departmentsService.getTaskSummary(department.id);
        // Merge, ensuring all keys from defaultTaskSummary are present
        finalTaskSummary = { ...defaultTaskSummary, ...summaryFromService };
      } else {
        this.logger.warn(`[formatDepartmentResponse] Department object missing ID for department named '${department.name}', cannot fetch task summary.`);
      }
    } catch (error) {
      this.logger.error(`[formatDepartmentResponse] Error fetching task summary for department ${department.id}. Using default task summary. Error: ${error.message}`);
      // finalTaskSummary already holds defaultTaskSummary
    }

    const active_projects = (finalTaskSummary.total - (finalTaskSummary[TaskStatus.COMPLETED] ?? 0) - (finalTaskSummary[TaskStatus.CANCELLED] ?? 0)) > 0 ? 1 : 0; // Simplified: any non-finished task means active project
    const completion_rate = finalTaskSummary.total > 0 
        ? Math.round(((finalTaskSummary[TaskStatus.COMPLETED] ?? 0) / finalTaskSummary.total) * 100) 
        : 0;

    const result = {
      id: department.id,
      name: department.name,
      description: department.description,
      headId: department.headId || null, // Ensure headId is present
      head_name,
      provinceId: department.provinceId || null, // Ensure provinceId is present
      province_name: department.province?.name || null,
      members_count,
      members: formattedMembers,
      active_projects,
      completion_rate,
      taskSummary: finalTaskSummary, // Send the full summary
      createdAt: department.createdAt,
      updatedAt: department.updatedAt,
    };

    this.logger.debug(`Formatted department result for ${result.id}: Name=${result.name}, Head=${result.head_name}, Members=${result.members_count}`);
    return result;
  }
}
