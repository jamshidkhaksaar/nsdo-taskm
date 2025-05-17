import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
  Logger,
  BadRequestException,
  Param,
  Delete,
  Put,
  Inject,
  forwardRef,
  NotFoundException,
  ParseUUIDPipe,
  ForbiddenException,
  Query,
} from "@nestjs/common";
import { UsersService } from "./users.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import * as bcrypt from "bcrypt";
import { ActivityLogService } from "../admin/services/activity-log.service";
import { TasksService } from "../tasks/tasks.service";
import { TaskQueryService } from "../tasks/task-query.service";
import { ApiOperation, ApiResponse, ApiTags, ApiBearerAuth, ApiOkResponse, ApiQuery } from "@nestjs/swagger";
import { PermissionsGuard } from "../rbac/guards/permissions.guard";
import { Permissions } from "../rbac/decorators/permissions.decorator";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { InitiatePasswordResetDto } from "./dto/initiate-password-reset.dto";
import { Roles } from "../rbac/decorators/roles.decorator";
import { RolesGuard } from "../rbac/guards/roles.guard";
import { PageOptionsDto } from "../common/dto/page-options.dto";
import { PageDto } from "../common/dto/page.dto";
import { User } from "./entities/user.entity";

@ApiTags("Users")
@ApiBearerAuth()
@Controller("users")
@UseGuards(JwtAuthGuard)
export class UsersController {
  private readonly logger = new Logger(UsersController.name);

  constructor(
    private readonly usersService: UsersService,
    @Inject(forwardRef(() => ActivityLogService))
    private readonly activityLogService: ActivityLogService,
    private readonly tasksService: TasksService,
    private readonly taskQueryService: TaskQueryService,
  ) {}

  @Get()
  @UseGuards(RolesGuard, PermissionsGuard)
  @Roles("User", "Leadership", "Administrator", "Super Admin")
  @Permissions('user:read')
  @ApiOperation({ summary: "Get all users with pagination and search" })
  @ApiOkResponse({ 
    description: "Successfully retrieved users.",
    type: PageDto<User>
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'take', required: false, type: Number, description: 'Items per page' })
  @ApiQuery({ name: 'q', required: false, type: String, description: 'Search term' })
  @ApiQuery({ name: 'order', required: false, enum: ['ASC', 'DESC'], description: 'Order (ASC/DESC)' })
  async getAllUsers(@Query() pageOptionsDto: PageOptionsDto): Promise<PageDto<User>> {
    this.logger.log(`Getting users with options: ${JSON.stringify(pageOptionsDto)}`);
    return this.usersService.getUsers(pageOptionsDto);
  }

  @Get(":id")
  @UseGuards(RolesGuard, PermissionsGuard)
  @Roles("User", "Leadership", "Administrator")
  @Permissions('user:read')
  async getUserById(@Param("id", ParseUUIDPipe) id: string, @Request() req) {
    this.logger.log(`Getting user with ID: ${id}`);

    // Log the activity
    await this.activityLogService.logFromRequest(
      req,
      "view",
      "user",
      `Viewed user details`,
      id,
    );

    const user = await this.usersService.findById(id);
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role && typeof user.role === 'object' ? { id: user.role.id, name: user.role.name } : user.role,
      isActive: user.isActive,
      status: user.isActive ? "active" : "inactive",
      position: user.position || "",
      departments: user.departments?.map(d => ({ id: d.id, name: d.name })) || [],
    };
  }

  @Post()
  @UseGuards(RolesGuard, PermissionsGuard)
  @Roles("Leadership", "Administrator")
  @Permissions('user:manage')
  async createUser(@Body() createUserDto: CreateUserDto, @Request() req) {
    this.logger.log(`Creating new user: ${createUserDto.username}`);

    const roleName = createUserDto.roleName || "user";

    const user = await this.usersService.create(
      createUserDto.username,
      createUserDto.email,
      createUserDto.password,
      roleName,
    );

    // Log the activity
    await this.activityLogService.logFromRequest(
      req,
      "create",
      "user",
      `Created new user: ${user.username}`,
      user.id,
    );

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role && typeof user.role === 'object' ? { id: user.role.id, name: user.role.name } : user.role,
      isActive: user.isActive,
    };
  }

  @Delete(":id")
  @UseGuards(RolesGuard, PermissionsGuard)
  @Roles("Leadership", "Administrator")
  @Permissions('user:manage')
  async deleteUser(@Param("id", ParseUUIDPipe) id: string, @Request() req) {
    this.logger.log(`Deleting user with ID: ${id}`);
    // First verify the user exists
    const user = await this.usersService.findById(id);

    // We'll need to add a method to the service to delete users
    await this.usersService.deleteUser(id);

    // Log the activity
    await this.activityLogService.logFromRequest(
      req,
      "delete",
      "user",
      `Deleted user: ${user.username}`,
      id,
    );

    return { message: `User ${user.username} deleted successfully` };
  }

  @Post("initiate-password-reset")
  @ApiOperation({ summary: "Initiate password reset for a user by email" })
  @ApiResponse({ status: 200, description: "If an account with that email exists, a password reset link has been sent." })
  @ApiResponse({ status: 400, description: "Invalid email format in request body." })
  async initiatePasswordReset(@Body() initiatePasswordResetDto: InitiatePasswordResetDto) {
    this.logger.log(`Initiating password reset for email: ${initiatePasswordResetDto.email}`);
    await this.usersService.initiatePasswordReset(initiatePasswordResetDto.email);
    return { message: "If an account with that email exists, a password reset link has been sent." };
  }

  @Post(':id/admin-reset-password')
  @UseGuards(RolesGuard, PermissionsGuard)
  @Roles("Administrator", "Super Admin") // Only admins can do this
  @Permissions('user:manage') // Requires permission to manage users
  @ApiOperation({ summary: "Admin resets a user's password" })
  @ApiResponse({ status: 200, description: "Password reset successfully, returns new temporary password." })
  @ApiResponse({ status: 403, description: "Forbidden." })
  @ApiResponse({ status: 404, description: "User not found." })
  async adminResetPassword(
    @Param("id", ParseUUIDPipe) id: string,
    @Request() req
  ): Promise<{ message: string; newPassword?: string }> {
    this.logger.log(`Admin attempting to reset password for user ID: ${id}`);
    const { newPassword, user } = await this.usersService.adminResetPassword(id);

    await this.activityLogService.logFromRequest(
      req,
      "admin_password_reset",
      "user",
      `Admin reset password for user: ${user.username}`,
      id,
    );

    return { 
      message: `Password for user ${user.username} has been reset.`,
      newPassword: newPassword 
    };
  }

  @Post(":id/toggle-status")
  @UseGuards(RolesGuard, PermissionsGuard)
  @Roles("Leadership", "Administrator")
  @Permissions('user:manage')
  async toggleStatus(@Param("id", ParseUUIDPipe) id: string, @Request() req) {
    this.logger.log(`Toggling status for user with ID: ${id}`);
    const user = await this.usersService.findById(id);

    const newStatus = !user.isActive;

    await this.usersService.updateStatus(id, newStatus);

    const action = newStatus ? "activate_user" : "deactivate_user";
    const message = `Status for ${user.username} has been ${newStatus ? "activated" : "deactivated"}`;
    await this.activityLogService.logFromRequest(
      req,
      action,
      "user",
      message,
      id,
    );

    return {
      message: message,
      status: newStatus ? "active" : "inactive",
    };
  }

  @UseGuards(RolesGuard, PermissionsGuard)
  @Roles("Leadership", "Administrator")
  @Permissions('user:manage')
  @Put(":id")
  async updateUser(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
    @Request() req,
  ) {
    this.logger.log(`Updating user with ID: ${id}`);

    const updatedUser = await this.usersService.updateUser(id, updateUserDto);

    await this.activityLogService.logFromRequest(
      req,
      "update",
      "user",
      `Updated user: ${updatedUser.username}`,
      id,
    );

    return {
      id: updatedUser.id,
      username: updatedUser.username,
      email: updatedUser.email,
      role: updatedUser.role && typeof updatedUser.role === 'object' ? { id: updatedUser.role.id, name: updatedUser.role.name } : updatedUser.role,
      isActive: updatedUser.isActive,
    };
  }

  @Get(":id/tasks")
  @ApiOperation({ summary: "Get tasks associated with a user (assigned or created)" })
  @UseGuards(RolesGuard)
  @Roles("Leadership", "Administrator")
  async getTasksForUser(@Param("id", ParseUUIDPipe) id: string, @Request() req) {
    const tasks = await this.taskQueryService.getTasksForUser(id);
    return tasks;
  }

  @Get(":id/performance")
  @UseGuards(RolesGuard)
  @Roles("Leadership", "Administrator")
  async getPerformance(@Param("id", ParseUUIDPipe) id: string, @Request() req) {
    this.logger.log(`Fetching performance data for user with ID: ${id}`);
    // Dummy data for now
    return {
      userId: id,
      performanceData: "Not implemented yet",
    };
  }
}
