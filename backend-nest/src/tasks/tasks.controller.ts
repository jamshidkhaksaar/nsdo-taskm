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

@Controller("tasks")
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiTags("Tasks")
export class TasksController {
  constructor(
    private readonly tasksService: TasksService,
    private readonly taskQueryService: TaskQueryService,
    private readonly activityLogService: ActivityLogService,
  ) {}

  @Post()
  create(@Body() createTaskDto: CreateTaskDto, @Request() req) {
    return this.tasksService.create(createTaskDto, req.user);
  }

  @Get()
  findAll(@Query() query, @Request() req) {
    return this.taskQueryService.findAll(query, req.user);
  }

  @Get("recycle-bin")
  @ApiOperation({
    summary: "Get deleted tasks from recycle bin (admin/leadership only)",
  })
  @ApiResponse({
    status: 200,
    description: "Returns paginated list of deleted tasks.",
  })
  @ApiResponse({
    status: 403,
    description: "Forbidden - Insufficient permissions.",
  })
  @Permissions("task.view.recyclebin")
  async getRecycleBin(@Query() query: RecycleBinQueryDto, @Request() req) {
    return this.taskQueryService.findAllDeleted(query, req.user);
  }

  @Get("dashboard")
  getDashboardTasks(@Request() req) {
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
  @Permissions("task.view.read")
  async findOne(@Param('id') id: string) {
    return this.taskQueryService.findOne(id);
  }

  @Put(":id")
  update(
    @Param("id") id: string,
    @Body() updateTaskDto: UpdateTaskDto,
    @Request() req,
  ) {
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
  @Permissions("task.delete.soft.own", "task.delete.soft.all")
  remove(
    @Param("id") id: string,
    @Body() deleteTaskDto: DeleteTaskDto,
    @Request() req,
  ) {
    return this.tasksService.remove(id, deleteTaskDto, req.user);
  }

  @Patch(":id/status")
  updateStatus(
    @Param("id") id: string,
    @Body() updateTaskStatusDto: UpdateTaskStatusDto,
    @Request() req,
  ) {
    return this.tasksService.updateStatus(id, updateTaskStatusDto, req.user);
  }

  @Patch(":id/priority")
  updatePriority(
    @Param("id") id: string,
    @Body() updateTaskPriorityDto: UpdateTaskPriorityDto,
    @Request() req,
  ) {
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
  @Permissions("task.delegate.own", "task.delegate.all")
  async delegateTask(
    @Param("id") id: string,
    @Body() delegateTaskDto: DelegateTaskDto,
    @Request() req,
  ) {
    return this.tasksService.delegateTask(id, delegateTaskDto, req.user);
  }

  @Post(":id/cancel")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      "Cancel a task (requires creator, admin, or leadership role and reason)",
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
  @Permissions("task.update.status.own", "task.update.status.all")
  cancelTask(
    @Param("id") id: string,
    @Body() updateStatusDto: UpdateTaskStatusDto,
    @Request() req,
  ) {
    updateStatusDto.status = TaskStatus.CANCELLED;
    return this.tasksService.updateStatus(id, updateStatusDto, req.user);
  }

  @Get("counts/by-status/department/:departmentId")
  @ApiOperation({
    summary: "Get task counts grouped by status for a specific department",
  })
  @ApiResponse({
    status: 200,
    description: "Returns counts of tasks for each status.",
    type: "object",
  })
  @ApiResponse({ status: 404, description: "Department not found." })
  async getTaskCountsByStatusForDepartment(
    @Param("departmentId") departmentId: string,
  ): Promise<TaskStatusCounts> {
    return this.taskQueryService.getTaskCountsByStatusForDepartment(
      departmentId,
    );
  }

  @Get("counts/by-status/user/:userId")
  @ApiOperation({
    summary: "Get task counts grouped by status for a specific user",
  })
  @ApiResponse({
    status: 200,
    description: "Returns counts of tasks for each status.",
    type: "object",
  })
  @ApiResponse({ status: 404, description: "User not found." })
  @Permissions("task.view.counts.user", "task.view.counts.own")
  async getTaskCountsByStatusForUser(
    @Param("userId") userId: string,
    @Request() req,
  ): Promise<TaskStatusCounts> {
    return this.taskQueryService.getTaskCountsByStatusForUser(userId);
  }

  @Post(":id/restore")
  @Permissions("task.restore")
  @ApiOperation({
    summary: "Restore task from recycle bin (admin/leadership only)",
  })
  @ApiResponse({ status: 200, description: "Task restored successfully." })
  @ApiResponse({
    status: 403,
    description: "Forbidden - Insufficient permissions to restore.",
  })
  @ApiResponse({ status: 404, description: "Task not found." })
  async restoreTask(@Param("id") id: string, @Request() req) {
    return this.tasksService.restoreTask(id, req.user);
  }

  @Delete(":id/permanent")
  @Permissions("task.delete.permanent")
  @ApiOperation({ summary: "Permanently delete task (admin only)" })
  @ApiResponse({ status: 200, description: "Task permanently deleted." })
  @ApiResponse({
    status: 403,
    description: "Forbidden - Insufficient permissions to delete.",
  })
  @ApiResponse({ status: 404, description: "Task not found." })
  async permanentDelete(@Param("id") id: string, @Request() req) {
    return this.tasksService.hardRemove(id, req.user);
  }
}
