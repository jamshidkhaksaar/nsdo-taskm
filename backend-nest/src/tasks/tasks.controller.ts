import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  Request,
  HttpCode,
  HttpStatus,
  Put,
  ForbiddenException,
  ParseUUIDPipe,
  Logger,
} from "@nestjs/common";
import { TasksService } from "./tasks.service";
import { TaskQueryService } from "./task-query.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CreateTaskDto } from "./dto/create-task.dto";
import { UpdateTaskDto } from "./dto/update-task.dto";
import { TaskStatus } from "./entities/task.entity";
import { UpdateTaskStatusDto } from "./dto/update-task-status.dto";
import { UpdateTaskPriorityDto } from "./dto/update-task-priority.dto";
import { DelegateTaskDto } from "./dto/delegate-task.dto";
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { Permissions } from "../rbac/decorators/permissions.decorator";
import { PermissionsGuard } from "../rbac/guards/permissions.guard";
import { TaskStatusCounts } from "./tasks.service";
import { DeleteTaskDto } from "./dto/delete-task.dto";
import { RecycleBinQueryDto } from "./dto/recycle-bin-query.dto";
import { ActivityLogService } from "../admin/services/activity-log.service";
import { Task } from "./entities/task.entity";
import { FindAllTasksDto } from "./dto/find-all-tasks.dto";
import { Roles } from "../rbac/decorators/roles.decorator";
import { RolesGuard } from "../rbac/guards/roles.guard";
import { AdminService } from "../admin/admin.service";
import { TaskOverviewStatsDto } from "../admin/admin.service";
import { UpdateTaskAssignmentsDto } from "./dto/update-task-assignments.dto";

@Controller("tasks")
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiTags("Tasks")
export class TasksController {
  private readonly logger = new Logger(TasksController.name);

  constructor(
    private readonly tasksService: TasksService,
    private readonly taskQueryService: TaskQueryService,
    private readonly activityLogService: ActivityLogService,
    private readonly adminService: AdminService,
  ) {}

  @Get("overview")
  @ApiOperation({
    summary: "Get comprehensive task overview statistics (Admin/Leadership)",
  })
  @ApiResponse({
    status: 200,
    description: "Returns task overview data.",
    type: TaskOverviewStatsDto,
  })
  @ApiResponse({
    status: 403,
    description: "Forbidden - Insufficient permissions.",
  })
  @UseGuards(RolesGuard)
  @Roles("Leadership", "Administrator", "Super Admin")
  async getTasksOverview(@Request() req): Promise<TaskOverviewStatsDto> {
    this.logger.log(
      `User ${req.user.userId} (${req.user.role?.name}) fetching task overview`,
    );
    return this.adminService.getTasksOverviewStats(req.user);
  }

  @Post()
  create(@Body() createTaskDto: CreateTaskDto, @Request() req) {
    this.logger.log(`User ${req.user.userId} creating task: ${createTaskDto.title}`);
    return this.tasksService.create(createTaskDto, req.user);
  }

  @Get()
  findAll(@Query() query: FindAllTasksDto, @Request() req) {
    this.logger.log(`User ${req.user.userId} finding tasks with query: ${JSON.stringify(query)}`);
    return this.taskQueryService.findAll(query, req.user);
  }

  @Get("recycle-bin")
  @ApiOperation({
    summary: "Get deleted tasks from recycle bin (Leadership/Admin only)",
  })
  @ApiResponse({
    status: 200,
    description: "Returns paginated list of deleted tasks.",
  })
  @ApiResponse({
    status: 403,
    description: "Forbidden - Insufficient permissions.",
  })
  @UseGuards(RolesGuard, PermissionsGuard)
  @Roles("Leadership", "Administrator", "Super Admin")
  @Permissions("task:read")
  async getRecycleBin(@Query() query: RecycleBinQueryDto, @Request() req) {
    this.logger.log(`User ${req.user.userId} accessing recycle bin with query: ${JSON.stringify(query)}`);
    return this.taskQueryService.findAllDeleted(query, req.user);
  }

  @Get("dashboard")
  getDashboardTasks(@Request() req) {
    this.logger.log(`User ${req.user.userId} fetching dashboard tasks`);
    return this.taskQueryService.getDashboardTasks(req.user.userId);
  }

  @Get("assigned-to-me")
  getTasksAssignedToMe(@Request() req) {
    return this.taskQueryService.getTasksAssignedToUser(req.user.userId);
  }

  @Get("created-by-me")
  getTasksCreatedByMe(@Request() req) {
    return this.taskQueryService.getTasksCreatedByUser(req.user.userId);
  }

  @Get("delegated-by-me")
  getTasksDelegatedByMe(@Request() req) {
    return this.taskQueryService.getTasksDelegatedByUser(req.user.userId);
  }

  @Get("delegated-to-me")
  getTasksDelegatedToMe(@Request() req) {
    return this.taskQueryService.getTasksDelegatedToUser(req.user.userId);
  }

  @Get(":id")
  @ApiOperation({ summary: 'Get a single task by ID' })
  @ApiResponse({ status: 200, description: 'Task found', type: Task })
  @ApiResponse({ status: 404, description: 'Task not found' })
  async findOne(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    this.logger.log(`Finding task with ID: ${id} for user ${req.user.userId}`);
    return this.taskQueryService.findOne(id);
  }

  @Put(":id")
  update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() updateTaskDto: UpdateTaskDto,
    @Request() req,
  ) {
    this.logger.log(`User ${req.user.userId} updating task ${id}`);
    return this.tasksService.update(id, updateTaskDto, req.user);
  }

  @Post(":id/delete")
  @ApiOperation({ summary: "Move task to recycle bin (requires comment)" })
  @ApiBody({ type: DeleteTaskDto })
  @ApiResponse({
    status: 200,
    description: "Task moved to recycle bin successfully.",
  })
  @ApiResponse({
    status: 403,
    description: "Forbidden - Insufficient permissions to delete.",
  })
  @ApiResponse({ status: 404, description: "Task not found." })
  @ApiResponse({
    status: 400,
    description: "Bad Request (e.g., insufficient deletion reason).",
  })
  @UseGuards(RolesGuard, PermissionsGuard)
  @Roles("Leadership", "Administrator")
  @Permissions("task:manage")
  remove(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() deleteTaskDto: DeleteTaskDto,
    @Request() req,
  ) {
    this.logger.log(`User ${req.user.userId} deleting (soft) task ${id}`);
    return this.tasksService.remove(id, deleteTaskDto, req.user);
  }

  @Patch(":id/status")
  updateStatus(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() updateTaskStatusDto: UpdateTaskStatusDto,
    @Request() req,
  ) {
    this.logger.log(`User ${req.user.userId} updating status for task ${id}`);
    return this.tasksService.updateStatus(id, updateTaskStatusDto, req.user);
  }

  @Patch(":id/priority")
  updatePriority(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() updateTaskPriorityDto: UpdateTaskPriorityDto,
    @Request() req,
  ) {
    this.logger.log(`User ${req.user.userId} updating priority for task ${id}`);
    return this.tasksService.updatePriority(
      id,
      updateTaskPriorityDto,
      req.user,
    );
  }

  @Post(":id/delegate")
  @ApiOperation({ summary: "Delegate a task to one or more users" })
  @ApiBody({ type: DelegateTaskDto })
  @ApiResponse({ status: 201, description: "Task delegated successfully." })
  @ApiResponse({ status: 400, description: "Invalid input or permissions." })
  @UseGuards(RolesGuard, PermissionsGuard)
  @Roles("Leadership", "Administrator")
  @Permissions("task:manage")
  async delegateTask(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() delegateTaskDto: DelegateTaskDto,
    @Request() req,
  ) {
    this.logger.log(`User ${req.user.userId} delegating task ${id}`);
    return this.tasksService.delegateTask(id, delegateTaskDto, req.user);
  }

  @Post(":id/cancel")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      "Cancel a task (requires creator, Admin, or Leadership role and reason)",
  })
  @ApiResponse({ status: 200, description: "Task cancelled successfully." })
  @ApiResponse({
    status: 403,
    description: "Forbidden - Insufficient permissions to cancel.",
  })
  @ApiResponse({ status: 404, description: "Task not found." })
  @ApiResponse({
    status: 400,
    description:
      "Bad Request (e.g., trying to cancel a completed task or insufficient reason).",
  })
  @UseGuards(RolesGuard, PermissionsGuard)
  @Roles("Leadership", "Administrator")
  @Permissions("task:manage")
  cancelTask(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() updateStatusDto: UpdateTaskStatusDto,
    @Request() req,
  ) {
    this.logger.log(`User ${req.user.userId} cancelling task ${id}`);
    updateStatusDto.status = TaskStatus.CANCELLED;
    return this.tasksService.updateStatus(id, updateStatusDto, req.user);
  }

  @Get("counts/by-status/department/:departmentId")
  @ApiOperation({
    summary: "Get task counts grouped by status for a specific department (Leadership/Admin)",
  })
  @ApiResponse({
    status: 200,
    description: "Returns counts of tasks for each status.",
    type: "object",
  })
  @ApiResponse({ status: 404, description: "Department not found." })
  @UseGuards(RolesGuard)
  @Roles("Leadership", "Administrator")
  async getTaskCountsByStatusForDepartment(
    @Param("departmentId", ParseUUIDPipe) departmentId: string,
  ): Promise<TaskStatusCounts> {
    this.logger.log(`Fetching task counts by status for department ${departmentId}`);
    return this.taskQueryService.getTaskCountsByStatusForDepartment(
      departmentId,
    );
  }

  @Get("counts/by-status/user/:userId")
  @ApiOperation({
    summary: "Get task counts grouped by status for a specific user (Leadership/Admin)",
  })
  @ApiResponse({
    status: 200,
    description: "Returns counts of tasks for each status.",
    type: "object",
  })
  @ApiResponse({ status: 404, description: "User not found." })
  @UseGuards(RolesGuard, PermissionsGuard)
  @Roles("Leadership", "Administrator")
  @Permissions("task:read")
  async getTaskCountsByStatusForUser(
    @Param("userId", ParseUUIDPipe) userId: string,
    @Request() req,
  ): Promise<TaskStatusCounts> {
    this.logger.log(`User ${req.user.userId} fetching task counts by status for user ${userId}`);
    return this.taskQueryService.getTaskCountsByStatusForUser(userId);
  }

  @Post(":id/restore")
  @UseGuards(RolesGuard, PermissionsGuard)
  @Roles("Leadership", "Administrator")
  @Permissions("task:manage")
  @ApiOperation({
    summary: "Restore task from recycle bin (Leadership/Admin only)",
  })
  @ApiResponse({ status: 200, description: "Task restored successfully." })
  @ApiResponse({
    status: 403,
    description: "Forbidden - Insufficient permissions to restore.",
  })
  @ApiResponse({ status: 404, description: "Task not found." })
  async restoreTask(@Param("id", ParseUUIDPipe) id: string, @Request() req) {
    this.logger.log(`User ${req.user.userId} restoring task ${id}`);
    return this.tasksService.restoreTask(id, req.user);
  }

  @Delete(":id/permanent")
  @UseGuards(RolesGuard, PermissionsGuard)
  @Roles("Administrator", "Super Admin")
  @Permissions("task:delete:permanent")
  @ApiOperation({ summary: "Permanently delete task (Admin only)" })
  @ApiResponse({ status: 200, description: "Task permanently deleted." })
  @ApiResponse({
    status: 403,
    description: "Forbidden - Insufficient permissions to delete.",
  })
  @ApiResponse({ status: 404, description: "Task not found." })
  async permanentDelete(@Param("id", ParseUUIDPipe) id: string, @Request() req) {
    this.logger.log(`User ${req.user.userId} permanently deleting task ${id}`);
    return this.tasksService.hardRemove(id, req.user);
  }

  @Patch(":id/assignments")
  @ApiOperation({ summary: "Update assignments for a specific task" })
  @ApiResponse({ status: 200, description: "Task assignments updated successfully", type: Task })
  @ApiResponse({ status: 400, description: "Invalid assignment data" })
  @ApiResponse({ status: 403, description: "Forbidden - Insufficient permissions" })
  @ApiResponse({ status: 404, description: "Task not found" })
  @Permissions("task:update", "task:assign")
  async updateTaskAssignments(
    @Param("id") id: string,
    @Body() updateTaskAssignmentsDto: UpdateTaskAssignmentsDto,
    @Request() req,
  ): Promise<Task> {
    this.logger.log(`PATCH /tasks/${id}/assignments request by user ${req.user.userId}`);
    return this.tasksService.updateAssignments(
      id,
      updateTaskAssignmentsDto,
      req.user,
    );
  }

  @Patch(":id/delegate-assignments-by-creator")
  @ApiOperation({ summary: "Delegate task assignments (creator only)" })
  @ApiBody({ type: DelegateTaskDto })
  @ApiResponse({ status: 200, description: "Task assignments delegated successfully by creator.", type: Task })
  @ApiResponse({ status: 400, description: "Invalid input, or task state does not allow delegation." })
  @ApiResponse({ status: 403, description: "Forbidden - Only the task creator can perform this action." })
  @ApiResponse({ status: 404, description: "Task not found." })
  async delegateTaskAssignmentsByCreator(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() delegateTaskDto: DelegateTaskDto,
    @Request() req,
  ): Promise<Task> {
    this.logger.log(
      `User ${req.user.userId} attempting creator-delegation for task ${id}`,
    );
    return this.tasksService.delegateTaskAssignmentsByCreator(
      id,
      delegateTaskDto,
      req.user,
    );
  }
}
