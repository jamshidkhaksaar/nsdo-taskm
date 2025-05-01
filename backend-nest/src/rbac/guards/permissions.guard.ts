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
import { Task } from "../../tasks/entities/task.entity"; // Import Task entity

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
    const user: User = request.user; // Assumes user object is attached by AuthGuard

    // Ensure user and role with permissions are loaded
    if (!user || !user.role || !user.role.permissions) {
      this.logger.error(
        "PermissionsGuard Error: User, user.role, or user.role.permissions not found on request object. Ensure AuthGuard populates user with role and permissions.",
      );
      throw new InternalServerErrorException(
        "User role or permissions information missing.",
      );
    }

    const userPermissions = user.role.permissions.map((perm) => perm.name);

    // --- Refined Permission Check (OR logic + Ownership) ---
    let canAccess = false;
    for (const requiredPerm of requiredPermissions) {
      const hasDirectPermission = userPermissions.includes(requiredPerm);

      // Case 1: User has a required non-'.own' permission (e.g., task.view.all)
      if (hasDirectPermission && !requiredPerm.endsWith('.own')) {
        canAccess = true;
        this.logger.debug(`Access granted via direct non-own permission: ${requiredPerm}`);
        break; // Allow access immediately
      }

      // Case 2: Check if user has the corresponding '.all' permission
      if (requiredPerm.endsWith('.own')) {
        const correspondingAllPermission = requiredPerm.replace('.own', '.all');
        if (userPermissions.includes(correspondingAllPermission)) {
          canAccess = true;
          this.logger.debug(`Access granted via corresponding .all permission: ${correspondingAllPermission} (for requested ${requiredPerm})`);
          break;
        }
      }

      // Case 3: User requires an '.own' permission and has it directly.
      // Now we need to verify ownership of the resource.
      if (hasDirectPermission && requiredPerm.endsWith('.own')) {
        const resourceId = context.switchToHttp().getRequest().params.id; // Assuming ID is in route params
        if (!resourceId) {
          this.logger.warn(
            `PermissionsGuard: Ownership permission '${requiredPerm}' required, but no resource ID found in request params. Checking next permission...`,
          );
          continue; // Cannot verify ownership, check next required permission
        }

        try {
          // Fetch the resource (Task in this case)
          // TODO: Make this resource-agnostic if guard is used elsewhere (e.g., based on decorator arg)
          this.logger.debug(`Fetching task ${resourceId} for ownership check (${requiredPerm})`);
          const task = await this.taskQueryService.findOne(resourceId);

          if (!task) {
            this.logger.warn(
              `PermissionsGuard: Task with ID ${resourceId} not found during ownership check for permission '${requiredPerm}'. Checking next permission...`,
            );
            continue; // Task doesn't exist, check next permission
          }

          // Perform ownership check (adjust as needed for your definition of 'own')
          const isCreator = task.createdById === user.id;
          const isAssignee = task.assignedToUsers?.some(assignee => assignee.id === user.id);

          if (isCreator || isAssignee) {
            canAccess = true;
            this.logger.debug(`Access granted via .own permission and ownership: ${requiredPerm}`);
            break; // User has the .own permission AND owns the resource
          } else {
             this.logger.debug(`Ownership check failed for user ${user.id} on task ${resourceId} (${requiredPerm})`);
          }
        } catch (error) {
          // Log error but potentially continue checking other permissions
          this.logger.error(
            `PermissionsGuard Error fetching/checking resource ${resourceId} for permission '${requiredPerm}': ${error.message}`,
            error.stack,
          );
          // Decide if an error here should deny access completely or just for this permission.
          // For now, let's be safe and continue (maybe another permission grants access).
          continue;
        }
      }
    }
    // --- End Refined Check ---

    if (!canAccess) {
      this.logger.warn(
        `PermissionsGuard Forbidden: User ${user.id} (Role: ${user.role.name}) does not meet required permissions/ownership for [${requiredPermissions.join(", ")}]`,
      );
      throw new ForbiddenException(
        `Insufficient permissions for this action.`,
      );
    }

    // Comment out or remove TODO as basic check is implemented
    // TODO: Implement resource-specific ownership checks here (e.g., for '.own' permissions)

    this.logger.log(
      `PermissionsGuard Granted: User ${user.id} (Role: ${user.role.name}) granted access for [${requiredPermissions.join(", ")}]`,
    );
    return true;
  }
} 