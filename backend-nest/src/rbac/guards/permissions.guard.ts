import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  InternalServerErrorException,
  Logger,
  Inject,
  forwardRef,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { User } from "../../users/entities/user.entity"; // Adjust path as needed
import { PERMISSIONS_KEY } from "../decorators/permissions.decorator";
import { TaskQueryService } from "../../tasks/task-query.service"; // Import TaskQueryService
// import { Task } from "../../tasks/entities/task.entity"; // Task entity not directly used in this snippet

@Injectable()
export class PermissionsGuard implements CanActivate {
  private readonly logger = new Logger(PermissionsGuard.name);

  constructor(
    private reflector: Reflector,
    @Inject(forwardRef(() => TaskQueryService))
    private taskQueryService: TaskQueryService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    // If no permissions are required, allow access
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user: User = request.user;

    // Ensure user and role are loaded
    if (!user || !user.role || !user.role.name) { // Check for role.name specifically
      this.logger.error(
        "PermissionsGuard Error: User, user.role, or user.role.name not found on request object.",
      );
      throw new InternalServerErrorException(
        "User role or name information missing.",
      );
    }

    // If the user is a Super Admin or admin, grant access immediately.
    const userRoleNameUpper = user.role.name.toUpperCase();
    if (userRoleNameUpper === "SUPER ADMIN" || userRoleNameUpper === "ADMIN") {
      this.logger.log(
        `PermissionsGuard Granted (Super Admin/Admin): User ${user.id} (Role: ${user.role.name}) automatically granted access.`
      );
      return true;
    }
    
    // Ensure user role permissions are loaded for non-Super Admins
    if (!user.role.permissions) {
        this.logger.error(
            `PermissionsGuard Error: user.role.permissions not found on request object for non-Super Admin user ${user.id}.`,
        );
        throw new InternalServerErrorException(
            "User permissions information missing.",
        );
    }

    const userPermissions = user.role.permissions.map((perm) => perm.name);

    // --- Refined Permission Check (OR logic + Ownership) ---
    let canAccess = false;
    for (const requiredPerm of requiredPermissions) {
      const hasDirectPermission = userPermissions.includes(requiredPerm);

      if (hasDirectPermission && !requiredPerm.endsWith('.own')) {
        canAccess = true;
        this.logger.debug(`Access granted via direct non-own permission: ${requiredPerm}`);
        break;
      }

      if (requiredPerm.endsWith('.own')) {
        const correspondingAllPermission = requiredPerm.replace('.own', '.all');
        if (userPermissions.includes(correspondingAllPermission)) {
          canAccess = true;
          this.logger.debug(`Access granted via corresponding .all permission: ${correspondingAllPermission} (for requested ${requiredPerm})`);
          break;
        }
      }

      if (hasDirectPermission && requiredPerm.endsWith('.own')) {
        const resourceId = request.params.id;
        if (!resourceId) {
          this.logger.warn(
            `PermissionsGuard: Ownership permission '${requiredPerm}' required, but no resource ID found in request params. Checking next permission...`,
          );
          continue;
        }
        try {
          let ownsResource = false;
          const resourceType = requiredPerm.split(':')[0];
          if (resourceType === 'user' && requiredPerm === 'user:edit:own_profile') {
            this.logger.debug(`Checking user ownership for ${requiredPerm}: user ${user.id} vs resource ${resourceId}`);
            if (user.id === resourceId) {
              ownsResource = true;
            }
          } else if (resourceType === 'task') {
            this.logger.debug(`Fetching task ${resourceId} for ownership check (${requiredPerm})`);
            const task = await this.taskQueryService.findOne(resourceId);
            if (!task) {
              this.logger.warn(
                `PermissionsGuard: Task with ID ${resourceId} not found during ownership check for permission '${requiredPerm}'. Checking next permission...`,
              );
              continue; 
            }
            const isCreator = task.createdById === user.id;
            const isAssignee = task.assignedToUsers?.some(assignee => assignee.id === user.id);
            if (isCreator || isAssignee) {
              ownsResource = true;
            }
          } else {
            this.logger.warn(`PermissionsGuard: Unhandled resource type '${resourceType}' for '.own' permission: ${requiredPerm}. Denying by default for this permission.`);
            continue;
          }
          if (ownsResource) {
            canAccess = true;
            this.logger.debug(`Access granted via .own permission and ownership: ${requiredPerm}`);
            break;
          } else {
            this.logger.debug(`Ownership check failed for user ${user.id} on resource ${resourceId} for permission ${requiredPerm}`);
          }
        } catch (error) {
          this.logger.error(
            `PermissionsGuard Error fetching/checking resource ${resourceId} for permission '${requiredPerm}': ${error.message}`,
            error.stack,
          );
          continue;
        }
      }
    }

    if (!canAccess) {
      this.logger.warn(
        `PermissionsGuard Forbidden: User ${user.id} (Role: ${user.role.name}) does not meet required permissions/ownership for [${requiredPermissions.join(", ")}]`,
      );
      throw new ForbiddenException(
        `Insufficient permissions for this action.`,
      );
    }

    this.logger.log(
      `PermissionsGuard Granted: User ${user.id} (Role: ${user.role.name}) granted access for [${requiredPermissions.join(", ")}]`,
    );
    return true;
  }
} 