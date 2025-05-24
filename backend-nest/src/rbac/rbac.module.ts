import { Module, forwardRef } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Role } from "./entities/role.entity";
import { Permission } from "./entities/permission.entity";
import { PermissionService } from "./services/permission.service";
import { RoleService } from "./services/role.service";
import { RolesGuard } from "./guards/roles.guard";
import { RbacSeederService } from "./services/rbac-seeder.service";
import { RbacAdminController } from "./controllers/rbac-admin.controller";
import { PermissionsGuard } from "./guards/permissions.guard";
import { TasksModule } from "../tasks/tasks.module";
// Import controllers, guards here later

@Module({
  imports: [
    TypeOrmModule.forFeature([Role, Permission]),
    forwardRef(() => TasksModule),
    // Import other necessary modules (e.g., forwardRef(() => UsersModule) if needed for circular deps)
  ],
  controllers: [RbacAdminController],
  providers: [
    PermissionService,
    RoleService,
    RolesGuard,
    RbacSeederService,
    PermissionsGuard,
    // Add RolesGuard, PermissionsGuard later
  ],
  exports: [
    PermissionService,
    RoleService,
    RolesGuard,
    PermissionsGuard,
    // Export services/guards if they need to be used outside this module
  ],
})
export class RbacModule {}
