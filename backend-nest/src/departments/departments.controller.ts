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
  constructor(
    private departmentsService: DepartmentsService,
    @Inject(forwardRef(() => ActivityLogService))
    private activityLogService: ActivityLogService,
    private tasksService: TasksService,
    private taskQueryService: TaskQueryService,
  ) {}

  @Get()
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
  async getDepartmentById(@Param("id") id: string, @Request() req) {
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
  @Roles("admin", "leadership")
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
  @Roles("admin", "leadership")
  async updateDepartment(
    @Param("id") id: string,
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
  @Roles("admin", "leadership")
  async deleteDepartment(@Param("id") id: string, @Request() req) {
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

  @Post("/:id/members/:userId/")
  @Roles("admin", "leadership")
  async addMember(
    @Param("id") id: string,
    @Param("userId") userId: string,
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

  @Delete("/:id/members/:userId/")
  @Roles("admin", "leadership")
  async removeMember(
    @Param("id") id: string,
    @Param("userId") userId: string,
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
  async getTasksForDepartment(@Param("id") id: string, @Request() req) {
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
      console.error(
        `Failed to log department task view activity: ${logError.message}`,
      );
    }

    return tasks;
  }

  @Get("/:id/performance")
  getDepartmentPerformance(@Param("id") id: string): Promise<any> {
    return this.departmentsService.getDepartmentPerformance(id);
  }

  @Get("/:id/members")
  async getDepartmentMembers(
    @Param("id") id: string,
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
      console.error(
        `Failed to log department member view activity: ${logError.message}`,
      );
    }

    return members; // Return the user array directly
  }

  // Helper method to format department responses
  private async formatDepartmentResponse(department: Department) {
    console.log(
      `Formatting department ${department.id}: head info:`,
      department.head
        ? { id: department.head.id, username: department.head.username }
        : "No head assigned",
    );
    console.log(`Department headId: ${department.headId}`);

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
          console.log(`Loaded head user for formatting: ${head.username}`);
        }
      } catch (error) {
        console.error(
          `Error loading head user for formatting: ${error.message}`,
        );
      }
    }

    if (head && head.username) {
      head_name = head.username;
      console.log(
        `Set head_name to ${head_name} for department ${department.id}`,
      );
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
          console.log(
            `Updated member count from direct query: ${members_count}`,
          );
        }
      } catch (error) {
        console.error(`Error getting direct member count: ${error.message}`);
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

    console.log(
      `Department ${department.id} has ${members_count} members:`,
      members.length > 0
        ? members.map((m) => `${m.name} (${m.id})`).join(", ")
        : "None",
    );

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

    console.log("Formatted department result: ", {
      id: result.id,
      name: result.name,
      head_name: result.head_name,
      members_count: result.members_count,
      members: members.length,
    });

    return result;
  }
}
