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

    // If no roles are required, allow access
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user: User = request.user; // Assumes user object is attached by AuthGuard

    if (!user || !user.role || !user.role.name) {
      // Added check for user.role.name
      throw new ForbiddenException(
        "User, user role, or role name not found in request for role check.",
      );
    }

    // Perform case-insensitive comparison
    const userRoleNameUpper = user.role.name.toUpperCase();
    const hasRole = requiredRoles.some(
      (requiredRoleName) => userRoleNameUpper === requiredRoleName.toUpperCase(),
    );

    if (!hasRole) {
      throw new ForbiddenException(
        `User role "${user.role.name}" is not authorized. Required roles: ${requiredRoles.join(", ")}`,
      );
    }

    return true;
  }
}
