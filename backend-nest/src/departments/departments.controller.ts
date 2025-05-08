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
  @Roles("User", "Leadership", "Administrator")
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
  @Roles("User", "Leadership", "Administrator")
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
  @Roles("Leadership", "Administrator")
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
  @Roles("Leadership", "Administrator")
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
  @Roles("Leadership", "Administrator")
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
  @Roles("Leadership", "Administrator")
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
  @Roles("Leadership", "Administrator")
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
  @Roles("Leadership", "Administrator")
  async getTasksForDepartment(@Param("id", ParseUUIDPipe) id: string, @Request() req) {
    // Use TaskQueryService
    const tasks = await this.taskQueryService.getTasksForDepartment(id);

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
  @Roles("Leadership", "Administrator")
  getDepartmentPerformance(@Param("id", ParseUUIDPipe) id: string): Promise<any> {
    return this.departmentsService.getDepartmentPerformance(id);
  }

  @Get("/:id/members")
  @Roles("Leadership", "Administrator")
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
    this.logger.debug(`Formatting department ${department.id}, headId: ${department.headId}`);

    // Format the head name from head object if it exists
    let head_name = "No Head Assigned";
    let head = department.head;

    // If we have a headId but no valid head object, try to load the head user
    if (department.headId && (!department.head || !department.head.username)) {
      try {
        const headUser = await this.departmentsService.getUserById(
          department.headId,
        );
        if (headUser) {
          head = headUser;
          this.logger.debug(`Loaded head user for formatting: ${head.username}`);
        }
      } catch (error) {
        this.logger.error(`Error loading head user for formatting: ${error.message}`, error.stack);
      }
    }

    if (head && head.username) {
      head_name = head.username;
      this.logger.debug(`Set head_name to ${head_name} for department ${department.id}`);
    }

    // Get members count - first try from the department.members array
    let members_count = department.members ? department.members.length : 0;

    // If members_count is 0, try a direct query to double-check
    if (members_count === 0) {
      try {
        // Get count directly from the junction table
        const memberCountResult = await this.departmentsService.getMemberCount(
          department.id,
        );
        if (memberCountResult > 0) {
          members_count = memberCountResult;
          this.logger.debug(`Updated member count from direct query: ${members_count}`);
        }
      } catch (error) {
        this.logger.error(`Error getting direct member count: ${error.message}`, error.stack);
      }
    }

    // Format members data properly for the frontend
    const members = department.members
      ? department.members.map((member) => {
          // Simplify to use just the available properties
          return {
            id: member.id,
            name: member.username || "Unknown User",
            avatar: null,
          };
        })
      : [];

    this.logger.debug(`Department ${department.id} has ${members_count} members.`);

    // Get tasks count for active projects (simplified)
    const active_projects = department.assignedTasks
      ? department.assignedTasks.filter(
          (task) => task.status !== TaskStatus.COMPLETED,
        ).length > 0
        ? 1
        : 0
      : 0;

    // Calculate completion rate
    const totalTasks = department.assignedTasks
      ? department.assignedTasks.length
      : 0;
    const completedTasks = department.assignedTasks
      ? department.assignedTasks.filter(
          (task) => task.status === TaskStatus.COMPLETED,
        ).length
      : 0;
    const completion_rate =
      totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Create a formatted response
    const result = {
      id: department.id,
      name: department.name,
      description: department.description,
      head: head || department.head,
      head_name,
      provinceId: department.provinceId,
      province_name: department.province?.name || null,
      members_count,
      members,
      active_projects,
      completion_rate,
      createdAt: department.createdAt,
      updatedAt: department.updatedAt,
    };

    this.logger.debug(`Formatted department result for ${result.id}: Name=${result.name}, Head=${result.head_name}, Members=${result.members_count}`);

    return result;
  }
}
