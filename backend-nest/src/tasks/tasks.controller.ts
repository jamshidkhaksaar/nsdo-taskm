import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, Request, HttpCode, HttpStatus, Put, ForbiddenException } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { Task } from './entities/task.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TaskStatus, TaskPriority } from './entities/task.entity';
import { UpdateTaskStatusDto } from './dto/update-task-status.dto';
import { UpdateTaskPriorityDto } from './dto/update-task-priority.dto';
import { DelegateTaskDto } from './dto/delegate-task.dto';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { DashboardTasksResponse, TaskStatusCounts } from './tasks.service';

@Controller('tasks')
@UseGuards(JwtAuthGuard)
@ApiTags('Tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  create(@Body() createTaskDto: CreateTaskDto, @Request() req) {
    return this.tasksService.create(createTaskDto, req.user);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.LEADERSHIP)
  findAll(@Query() query, @Request() req) {
    return this.tasksService.findAll(query, req.user);
  }

  @Get('dashboard')
  getDashboardTasks(@Request() req) {
    return this.tasksService.getDashboardTasks(req.user);
  }

  @Get('assigned-to-me')
  getTasksAssignedToMe(@Request() req) {
    return this.tasksService.getTasksAssignedToUser(req.user.userId);
  }

  @Get('created-by-me')
  getTasksCreatedByMe(@Request() req) {
    return this.tasksService.getTasksCreatedByUser(req.user.userId);
  }

  @Get('delegated-by-me')
  getTasksDelegatedByMe(@Request() req) {
    return this.tasksService.getTasksDelegatedByUser(req.user.userId);
  }

  @Get('delegated-to-me')
  getTasksDelegatedToMe(@Request() req) {
    return this.tasksService.getTasksDelegatedToUser(req.user.userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tasksService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateTaskDto: UpdateTaskDto, @Request() req) {
    return this.tasksService.update(id, updateTaskDto, req.user);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.tasksService.remove(id, req.user);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() updateTaskStatusDto: UpdateTaskStatusDto,
    @Request() req
  ) {
    return this.tasksService.updateStatus(id, updateTaskStatusDto, req.user);
  }

  @Patch(':id/priority')
  updatePriority(
    @Param('id') id: string,
    @Body() updateTaskPriorityDto: UpdateTaskPriorityDto,
    @Request() req
  ) {
    return this.tasksService.updatePriority(id, updateTaskPriorityDto, req.user);
  }

  @Post(':id/delegate')
  @ApiOperation({ summary: 'Delegate a task to one or more users' })
  @ApiBody({ type: DelegateTaskDto })
  @ApiResponse({ status: 201, description: 'Task delegated successfully.' })
  @ApiResponse({ status: 400, description: 'Invalid input or permissions.' })
  async delegateTask(
    @Param('id') id: string,
    @Body() delegateTaskDto: DelegateTaskDto,
    @Request() req
  ) {
    return this.tasksService.delegateTask(id, delegateTaskDto, req.user);
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel a task (requires creator, admin, or leadership role)' })
  @ApiResponse({ status: 200, description: 'Task cancelled successfully.' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions to cancel.' })
  @ApiResponse({ status: 404, description: 'Task not found.' })
  @ApiResponse({ status: 400, description: 'Bad Request (e.g., trying to cancel a completed task).' })
  cancelTask(@Param('id') id: string, @Request() req) {
    const updateStatusDto: UpdateTaskStatusDto = { status: TaskStatus.CANCELLED };
    return this.tasksService.updateStatus(id, updateStatusDto, req.user);
  }

  @Get('counts/by-status/department/:departmentId')
  @ApiOperation({ summary: 'Get task counts grouped by status for a specific department' })
  @ApiResponse({ status: 200, description: 'Returns counts of tasks for each status.', type: 'object' })
  @ApiResponse({ status: 404, description: 'Department not found.' })
  async getTaskCountsByStatusForDepartment(@Param('departmentId') departmentId: string): Promise<TaskStatusCounts> {
    return this.tasksService.getTaskCountsByStatusForDepartment(departmentId);
  }

  @Get('counts/by-status/user/:userId')
  @ApiOperation({ summary: 'Get task counts grouped by status for a specific user' })
  @ApiResponse({ status: 200, description: 'Returns counts of tasks for each status.', type: 'object' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  async getTaskCountsByStatusForUser(@Param('userId') userId: string, @Request() req): Promise<TaskStatusCounts> {
    const requestingUser = req.user;
    if (requestingUser.role !== UserRole.ADMIN && requestingUser.role !== UserRole.LEADERSHIP && requestingUser.userId !== userId) {
        throw new ForbiddenException('You do not have permission to view task counts for this user.');
    }
    return this.tasksService.getTaskCountsByStatusForUser(userId);
  }
}