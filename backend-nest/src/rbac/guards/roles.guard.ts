import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { User } from "../../users/entities/user.entity"; // Adjust path as needed
import { ROLES_KEY } from "../decorators/roles.decorator";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user: User = request.user;

    if (!user || !user.role || !user.role.name) {
      throw new ForbiddenException(
        "User, user role, or role name not found in request for role check.",
      );
    }

    const userRoleNameUpper = user.role.name.toUpperCase();

    // If the user is an admin, grant access immediately.
    if (userRoleNameUpper === "ADMIN") {
      return true;
    }

    // Original check for other roles
    const hasRequiredRole = requiredRoles.some(
      (requiredRoleName) => userRoleNameUpper === requiredRoleName.toUpperCase(),
    );

    if (!hasRequiredRole) {
      throw new ForbiddenException(
        `User role "${user.role.name}" is not authorized. Required roles: ${requiredRoles.join(", ")}`,
      );
    }

    return true;
  }
}
