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
import { UpdateDelegationStatusDto } from "./dto/update-delegation-status.dto";

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
  @Roles("Leadership", "admin")
  async getTasksOverview(@Request() req): Promise<TaskOverviewStatsDto> {
    this.logger.log(
      `User ${req.user.id} (${req.user.role?.name}) fetching task overview`,
    );
    return this.adminService.getTasksOverviewStats(req.user);
  }

  @Post()
  create(@Body() createTaskDto: CreateTaskDto, @Request() req) {
    this.logger.log(`User ${req.user.id} creating task: ${createTaskDto.title}`);
    return this.tasksService.create(createTaskDto, req.user.id);
  }

  @Get()
  findAll(@Query() query: FindAllTasksDto, @Request() req) {
    this.logger.log(`User ${req.user.id} finding tasks with query: ${JSON.stringify(query)}`);
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
  @UseGuards(RolesGuard)
  @Roles("admin")
  async getRecycleBin(@Query() query: RecycleBinQueryDto, @Request() req) {
    this.logger.log(`User ${req.user.id} accessing recycle bin with query: ${JSON.stringify(query)}`);
    return this.taskQueryService.findAllDeleted(query, req.user);
  }

  @Get("dashboard")
  getDashboardTasks(@Request() req) {
    this.logger.log(`User ${req.user.id} fetching dashboard tasks`);
    return this.taskQueryService.getDashboardTasks(req.user);
  }

  @Get("assigned-to-me")
  getTasksAssignedToMe(@Request() req) {
    this.logger.log(`User ${req.user.id} fetching tasks assigned to them`);
    return this.taskQueryService.getTasksAssignedToUser(req.user.id);
  }

  @Get("created-by-me")
  getTasksCreatedByMe(@Request() req) {
    this.logger.log(`User ${req.user.id} fetching tasks created by them`);
    return this.taskQueryService.getTasksCreatedByUser(req.user.id);
  }

  @Get("delegated-by-me")
  getTasksDelegatedByMe(@Request() req) {
    this.logger.log(`User ${req.user.id} fetching tasks delegated by them`);
    return this.taskQueryService.getTasksDelegatedByUser(req.user.id);
  }

  @Get("delegated-to-me")
  getTasksDelegatedToMe(@Request() req) {
    this.logger.log(`User ${req.user.id} fetching tasks delegated to them`);
    return this.taskQueryService.getTasksDelegatedToUser(req.user.id);
  }

  @Get(":id")
  @ApiOperation({ summary: 'Get a single task by ID' })
  @ApiResponse({ status: 200, description: 'Task found', type: Task })
  @ApiResponse({ status: 404, description: 'Task not found' })
  async findOne(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    this.logger.log(`Finding task with ID: ${id} for user ${req.user.id}`);
    return this.taskQueryService.findOne(id);
  }

  @Put(":id")
  update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() updateTaskDto: UpdateTaskDto,
    @Request() req,
  ) {
    this.logger.log(`User ${req.user.id} updating task ${id}`);
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
  @Permissions("task.delete.soft", "task.delete.own")
  remove(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() deleteTaskDto: DeleteTaskDto,
    @Request() req,
  ) {
    this.logger.log(`User ${req.user.id} deleting (soft) task ${id}`);
    return this.tasksService.remove(id, deleteTaskDto, req.user);
  }

  @Patch(":id/status")
  updateStatus(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() updateTaskStatusDto: UpdateTaskStatusDto,
    @Request() req,
  ) {
    this.logger.log(`User ${req.user.id} updating status for task ${id}`);
    return this.tasksService.updateStatus(id, updateTaskStatusDto, req.user);
  }

  @Patch(":id/priority")
  updatePriority(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() updateTaskPriorityDto: UpdateTaskPriorityDto,
    @Request() req,
  ) {
    this.logger.log(`User ${req.user.id} updating priority for task ${id}`);
    return this.tasksService.updatePriority(
      id,
      updateTaskPriorityDto,
      req.user,
    );
  }

  @Post(":id/request-delegation")
  @ApiOperation({ summary: "Request delegation of a task to another user (requires creator approval)" })
  @ApiBody({ type: DelegateTaskDto })
  @ApiResponse({ status: 200, description: "Delegation request submitted successfully. Pending creator approval.", type: Task })
  @ApiResponse({ status: 400, description: "Invalid input, task status, or target user." })
  @ApiResponse({ status: 403, description: "Forbidden - Not an assignee of the task or trying to delegate to self/creator." })
  @ApiResponse({ status: 404, description: "Task or target user not found." })
  async requestTaskDelegation(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() delegateTaskDto: DelegateTaskDto,
    @Request() req,
  ) {
    this.logger.log(`User ${req.user.username} (ID: ${req.user.id}) requesting delegation for task ${id} to user ${delegateTaskDto.delegatedToUserId}`);
    return this.tasksService.requestTaskDelegation(id, delegateTaskDto, req.user);
  }

  @Patch(":id/delegation-review")
  @ApiOperation({ summary: "Approve or reject a pending task delegation request (Task Creator only)" })
  @ApiBody({ type: UpdateDelegationStatusDto })
  @ApiResponse({ status: 200, description: "Delegation request processed successfully.", type: Task })
  @ApiResponse({ status: 400, description: "Invalid input or task state for delegation review." })
  @ApiResponse({ status: 403, description: "Forbidden - Only task creator can review." })
  @ApiResponse({ status: 404, description: "Task not found." })
  async approveOrRejectDelegation(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() updateDelegationStatusDto: UpdateDelegationStatusDto,
    @Request() req,
  ) {
    this.logger.log(`User ${req.user.username} (ID: ${req.user.id}) reviewing delegation for task ${id} with status ${updateDelegationStatusDto.status}`);
    return this.tasksService.approveOrRejectDelegation(id, updateDelegationStatusDto, req.user);
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
  @Permissions("task.cancel", "task.manage")
  cancelTask(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() updateStatusDto: UpdateTaskStatusDto,
    @Request() req,
  ) {
    this.logger.log(`User ${req.user.id} cancelling task ${id}`);
    const dtoForCancel: UpdateTaskStatusDto = {
        ...updateStatusDto,
        status: TaskStatus.CANCELLED,
    };
    if (!dtoForCancel.cancellationReason) {
        throw new ForbiddenException("Cancellation reason must be provided.");
    }
    return this.tasksService.updateStatus(id, dtoForCancel, req.user);
  }

  @Get(":departmentId/tasks/status-counts")
  @ApiOperation({
    summary: "Get task counts by status for a specific department (Admin/Leadership)",
  })
  @ApiResponse({
    status: 200,
    description: "Returns task counts by status for the department.",
  })
  @ApiResponse({ status: 403, description: "Forbidden." })
  @UseGuards(RolesGuard)
  @Roles("Leadership", "admin")
  async getTaskCountsByStatusForDepartment(
    @Param("departmentId", ParseUUIDPipe) departmentId: string,
  ): Promise<TaskStatusCounts> {
    this.logger.log(`Fetching task status counts for department ${departmentId}`);
    return this.taskQueryService.getTaskCountsByStatusForDepartment(
      departmentId,
    );
  }

  @Get("user/:userId/tasks/status-counts")
  @ApiOperation({
    summary: "Get task counts by status for a specific user (Admin/Leadership or self)",
  })
  @ApiResponse({
    status: 200,
    description: "Returns task counts by status for the user.",
  })
  @ApiResponse({ status: 403, description: "Forbidden." })
  async getTaskCountsByStatusForUser(
    @Param("userId", ParseUUIDPipe) userId: string,
    @Request() req,
  ): Promise<TaskStatusCounts> {
    const isAdminOrLeadership = req.user.roles?.some((role: string) =>
      ["admin", "Leadership"].includes(role),
    );
    if (!isAdminOrLeadership && req.user.id !== userId) {
      throw new ForbiddenException(
        "You do not have permission to view these task counts.",
      );
    }
    this.logger.log(`Fetching task status counts for user ${userId}`);
    return this.taskQueryService.getTaskCountsByStatusForUser(userId);
  }

  @Patch(":id/restore")
  @ApiOperation({ summary: "Restore a soft-deleted task (Admin/Leadership only)" })
  @ApiResponse({ status: 200, description: "Task restored successfully.", type: Task })
  @ApiResponse({ status: 403, description: "Forbidden." })
  @ApiResponse({ status: 404, description: "Task not found or not deleted." })
  @UseGuards(RolesGuard)
  @Roles("Leadership", "admin")
  async restoreTask(@Param("id", ParseUUIDPipe) id: string, @Request() req) {
    this.logger.log(`User ${req.user.id} restoring task ${id}`);
    return this.tasksService.restoreTask(id, req.user);
  }

  @Delete(":id/permanent")
  @ApiOperation({ summary: "Permanently delete a task (Admin only)" })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiResponse({ status: 204, description: "Task permanently deleted." })
  @ApiResponse({ status: 403, description: "Forbidden." })
  @ApiResponse({ status: 404, description: "Task not found." })
  @UseGuards(RolesGuard)
  @Roles("admin")
  async permanentDelete(@Param("id", ParseUUIDPipe) id: string, @Request() req) {
    this.logger.log(`User ${req.user.id} permanently deleting task ${id}`);
    return this.tasksService.hardRemove(id, req.user);
  }

  @Put(":id/assignments")
  @ApiOperation({ summary: "Update task assignments (creator or Admin/Leadership)" })
  @ApiBody({ type: UpdateTaskAssignmentsDto })
  @ApiResponse({ status: 200, description: "Task assignments updated successfully.", type: Task })
  @ApiResponse({ status: 400, description: "Invalid assignment combination or data." })
  @ApiResponse({ status: 403, description: "Forbidden." })
  @ApiResponse({ status: 404, description: "Task, user, department, or province not found." })
  @Permissions("task:update", "task:assign")
  async updateTaskAssignments(
    @Param("id") id: string,
    @Body() updateTaskAssignmentsDto: UpdateTaskAssignmentsDto,
    @Request() req,
  ): Promise<Task> {
    this.logger.log(`User ${req.user.id} (Role: ${req.user.role?.name}) updating assignments for task ${id}`);
    return this.tasksService.updateAssignments(id, updateTaskAssignmentsDto, req.user);
  }
}
