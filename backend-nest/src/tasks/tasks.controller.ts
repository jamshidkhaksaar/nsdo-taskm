import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskStatusDto } from './dto/update-task-status.dto';
import { Task } from './entities/task.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User } from '../users/entities/user.entity';
import { UpdateTaskDto } from './dto/update-task.dto';
import { AssignTaskToDepartmentDto } from './dto/assign-task-to-department.dto';

@Controller('tasks')
@UseGuards(JwtAuthGuard)
export class TasksController {
  constructor(private tasksService: TasksService) {}

  @Get()
  getTasks(
    @GetUser() user: User,
    @Query() filters: any,
  ): Promise<Task[]> {
    return this.tasksService.getTasks(user, filters);
  }

  @Get('/department/:departmentId')
  getTasksByDepartment(
    @Param('departmentId') departmentId: string,
    @GetUser() user: User,
  ): Promise<Task[]> {
    return this.tasksService.getTasks(user, { department: departmentId });
  }

  @Get('/user/:userId/statistics')
  getUserTaskStatistics(
    @Param('userId') userId: string,
    @GetUser() user: User,
  ): Promise<any> {
    // Only allow users to see their own statistics or admins to see anyone's
    if (user.id === userId || user.role === 'admin') {
      return this.tasksService.getUserTaskStatistics(userId);
    }
    // If not authorized, return the current user's statistics instead
    return this.tasksService.getUserTaskStatistics(user.id);
  }

  @Get('/:id')
  getTaskById(@Param('id') id: string, @GetUser() user: User): Promise<Task> {
    return this.tasksService.getTaskById(id, user);
  }

  @Post()
  createTask(
    @Body() createTaskDto: CreateTaskDto,
    @GetUser() user: User,
  ): Promise<Task> {
    return this.tasksService.createTask(createTaskDto, user);
  }

  @Patch('/:id')
  updateTask(
    @Param('id') id: string,
    @Body() updateTaskDto: UpdateTaskDto,
    @GetUser() user: User,
  ): Promise<Task> {
    return this.tasksService.updateTask(id, updateTaskDto, user);
  }

  @Delete('/:id')
  deleteTask(@Param('id') id: string, @GetUser() user: User): Promise<void> {
    return this.tasksService.deleteTask(id, user);
  }

  @Patch('/:id/status')
  updateTaskStatus(
    @Param('id') id: string,
    @Body() updateTaskStatusDto: UpdateTaskStatusDto,
    @GetUser() user: User,
  ): Promise<Task> {
    const { status } = updateTaskStatusDto;
    return this.tasksService.updateTaskStatus(id, status, user);
  }

  @Post('/:id/assign/:userId')
  assignTaskToUser(
    @Param('id') taskId: string,
    @Param('userId') userId: string,
    @GetUser() user: User,
  ): Promise<Task> {
    return this.tasksService.assignTaskToUser(taskId, userId, user);
  }

  @Delete('/:id/assign/:userId')
  unassignTaskFromUser(
    @Param('id') taskId: string,
    @Param('userId') userId: string,
    @GetUser() user: User,
  ): Promise<Task> {
    return this.tasksService.unassignTaskFromUser(taskId, userId, user);
  }

  @Post('/:id/department')
  assignTaskToDepartment(
    @Param('id') taskId: string,
    @Body() assignTaskToDepartmentDto: AssignTaskToDepartmentDto,
    @GetUser() user: User,
  ): Promise<Task> {
    return this.tasksService.updateTask(taskId, { departmentId: assignTaskToDepartmentDto.departmentId }, user);
  }

  @Delete('/:id/department')
  unassignTaskFromDepartment(
    @Param('id') taskId: string,
    @GetUser() user: User,
  ): Promise<Task> {
    return this.tasksService.updateTask(taskId, { departmentId: undefined }, user);
  }
} 