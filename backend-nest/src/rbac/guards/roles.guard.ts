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

    if (!user || !user.role) {
      // Or handle as unauthorized if preferred
      throw new ForbiddenException(
        "User or user role not found in request for role check.",
      );
    }

    // Check if the user's role name is included in the required roles
    const hasRole = requiredRoles.some(
      (roleName) => user.role.name === roleName,
    );

    if (!hasRole) {
      throw new ForbiddenException(
        `User role \"${user.role.name}\" is not authorized. Required roles: ${requiredRoles.join(", ")}`,
      );
    }

    return true;
  }
}
