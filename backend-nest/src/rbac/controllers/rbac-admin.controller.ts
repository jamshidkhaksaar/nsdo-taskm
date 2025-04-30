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
  NotFoundException,
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

// Simple DTOs for request validation
class CreateRoleDto {
  name: string;
  description?: string;
  permissionIds?: string[];
}

class UpdateRoleDto {
  name?: string;
  description?: string;
  permissionIds?: string[];
}

@Controller("admin/rbac")
@UseGuards(JwtAuthGuard, RolesGuard)
export class RbacAdminController {
  constructor(
    private readonly roleService: RoleService,
    private readonly permissionService: PermissionService,
    private readonly rbacSeederService: RbacSeederService,
  ) {}

  @Post("migrate")
  @Roles("admin", "Super Admin")
  @HttpCode(HttpStatus.OK)
  async runMigration() {
    try {
      await migrateToRbac();
      return {
        success: true,
        message: "RBAC migration completed successfully",
      };
    } catch (error) {
      return {
        success: false,
        message: "RBAC migration failed",
        error: error.message,
      };
    }
  }

  @Post("init")
  @Roles("admin", "Super Admin")
  @HttpCode(HttpStatus.OK)
  async initializeRbac() {
    try {
      // First, seed the permissions and roles
      await this.rbacSeederService.seedPermissions();
      await this.rbacSeederService.seedRoles();

      return {
        success: true,
        message:
          "RBAC system initialized successfully. Now run the migration endpoint to update users.",
      };
    } catch (error) {
      return {
        success: false,
        message: "RBAC initialization failed",
        error: error.message,
      };
    }
  }

  // Role Management Endpoints
  @Get("roles")
  @Roles("admin", "Super Admin")
  async getAllRoles(): Promise<Role[]> {
    return this.roleService.findAll();
  }

  @Get("roles/:id")
  @Roles("admin", "Super Admin")
  async getRoleById(@Param("id") id: string): Promise<Role> {
    return this.roleService.findById(id);
  }

  @Post("roles")
  @Roles("admin", "Super Admin")
  async createRole(@Body() createRoleDto: CreateRoleDto): Promise<Role> {
    return this.roleService.create(createRoleDto);
  }

  @Put("roles/:id")
  @Roles("admin", "Super Admin")
  async updateRole(
    @Param("id") id: string,
    @Body() updateRoleDto: UpdateRoleDto,
  ): Promise<Role> {
    return this.roleService.update(id, updateRoleDto);
  }

  @Delete("roles/:id")
  @Roles("admin", "Super Admin")
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteRole(@Param("id") id: string): Promise<void> {
    return this.roleService.delete(id);
  }

  // Permission Management Endpoints
  @Get("permissions")
  @Roles("admin", "Super Admin")
  async getAllPermissions(): Promise<Permission[]> {
    return this.permissionService.findAll();
  }

  @Get("permissions/:id")
  @Roles("admin", "Super Admin")
  async getPermissionById(@Param("id") id: string): Promise<Permission> {
    return this.permissionService.findById(id);
  }

  // Role-Permission Management
  @Post("roles/:roleId/permissions/:permissionId")
  @Roles("admin", "Super Admin")
  async addPermissionToRole(
    @Param("roleId") roleId: string,
    @Param("permissionId") permissionId: string,
  ): Promise<Role> {
    return this.roleService.addPermissionToRole(roleId, permissionId);
  }

  @Delete("roles/:roleId/permissions/:permissionId")
  @Roles("admin", "Super Admin")
  async removePermissionFromRole(
    @Param("roleId") roleId: string,
    @Param("permissionId") permissionId: string,
  ): Promise<Role> {
    return this.roleService.removePermissionFromRole(roleId, permissionId);
  }
}
