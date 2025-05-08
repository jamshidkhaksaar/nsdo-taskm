import {
  Controller,
  Post,
  UseGuards,
  HttpStatus,
  HttpCode,
  Get,
  Param,
  Body,
  Put,
  Delete,
  ValidationPipe,
  ParseUUIDPipe,
  Logger,
} from "@nestjs/common";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../guards/roles.guard";
import { Roles } from "../decorators/roles.decorator";
import { migrateToRbac } from "../../scripts/migrate-to-rbac";
import { RoleService } from "../services/role.service";
import { PermissionService } from "../services/permission.service";
import { Role } from "../entities/role.entity";
import { Permission } from "../entities/permission.entity";
import { RbacSeederService } from "../services/rbac-seeder.service";
import { CreateRoleDto } from "../dto/create-role.dto";
import { UpdateRoleDto } from "../dto/update-role.dto";
import { CreatePermissionDto } from "../dto/create-permission.dto";
import { UpdatePermissionDto } from "../dto/update-permission.dto";

@Controller("admin/rbac")
@UseGuards(JwtAuthGuard, RolesGuard)
export class RbacAdminController {
  private readonly logger = new Logger(RbacAdminController.name);

  constructor(
    private readonly roleService: RoleService,
    private readonly permissionService: PermissionService,
    private readonly rbacSeederService: RbacSeederService,
  ) {}

  @Post("migrate")
  @Roles("Administrator")
  @HttpCode(HttpStatus.OK)
  async runMigration() {
    try {
      await migrateToRbac();
      return {
        success: true,
        message: "RBAC migration completed successfully",
      };
    } catch (error) {
      this.logger.error(`RBAC migration failed: ${error.message}`, error.stack);
      return {
        success: false,
        message: "RBAC migration failed",
        error: error.message,
      };
    }
  }

  @Post("init")
  @Roles("Administrator")
  @HttpCode(HttpStatus.OK)
  async initializeRbac() {
    try {
      await this.rbacSeederService.seedPermissions();
      await this.rbacSeederService.seedRoles();
      return {
        success: true,
        message: "RBAC system initialized successfully. Now run the migration endpoint to update users.",
      };
    } catch (error) {
      this.logger.error(`RBAC initialization failed: ${error.message}`, error.stack);
      return {
        success: false,
        message: "RBAC initialization failed",
        error: error.message,
      };
    }
  }

  // Role Management Endpoints
  @Get("roles")
  @Roles("Administrator")
  async getAllRoles(): Promise<Role[]> {
    return this.roleService.findAll();
  }

  @Get("roles/:id")
  @Roles("Administrator")
  async getRoleById(@Param("id", ParseUUIDPipe) id: string): Promise<Role> {
    return this.roleService.findById(id);
  }

  @Post("roles")
  @Roles("Administrator")
  async createRole(@Body() createRoleDto: CreateRoleDto): Promise<Role> {
    return this.roleService.create(createRoleDto);
  }

  @Put("roles/:id")
  @Roles("Administrator")
  async updateRole(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() updateRoleDto: UpdateRoleDto,
  ): Promise<Role> {
    return this.roleService.update(id, updateRoleDto);
  }

  @Delete("roles/:id")
  @Roles("Administrator")
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteRole(@Param("id", ParseUUIDPipe) id: string): Promise<void> {
    return this.roleService.delete(id);
  }

  // Permission Management Endpoints
  @Get("permissions")
  @Roles("Administrator")
  async getAllPermissions(): Promise<Permission[]> {
    return this.permissionService.findAll();
  }

  @Get("permissions/:id")
  @Roles("Administrator")
  async getPermissionById(@Param("id", ParseUUIDPipe) id: string): Promise<Permission> {
    return this.permissionService.findById(id);
  }

  @Post("permissions")
  @Roles("Administrator")
  @HttpCode(HttpStatus.CREATED)
  async createPermission(
    @Body() createPermissionDto: CreatePermissionDto,
  ): Promise<Permission> {
    return this.permissionService.create(createPermissionDto);
  }

  @Put("permissions/:id")
  @Roles("Administrator")
  async updatePermission(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() updatePermissionDto: UpdatePermissionDto,
  ): Promise<Permission> {
    return this.permissionService.update(id, updatePermissionDto);
  }

  @Delete("permissions/:id")
  @Roles("Administrator")
  @HttpCode(HttpStatus.NO_CONTENT)
  async deletePermission(@Param("id", ParseUUIDPipe) id: string): Promise<void> {
    return this.permissionService.remove(id);
  }

  // Role-Permission Management
  @Post("roles/:roleId/permissions/:permissionId")
  @Roles("Administrator")
  async addPermissionToRole(
    @Param("roleId", ParseUUIDPipe) roleId: string,
    @Param("permissionId", ParseUUIDPipe) permissionId: string,
  ): Promise<Role> {
    return this.roleService.addPermissionToRole(roleId, permissionId);
  }

  @Delete("roles/:roleId/permissions/:permissionId")
  @Roles("Administrator")
  async removePermissionFromRole(
    @Param("roleId", ParseUUIDPipe) roleId: string,
    @Param("permissionId", ParseUUIDPipe) permissionId: string,
  ): Promise<Role> {
    return this.roleService.removePermissionFromRole(roleId, permissionId);
  }
}
