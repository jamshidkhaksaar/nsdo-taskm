import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RoleService } from '../services/role.service';
import { User } from '../../users/entities/user.entity'; // Adjust path as needed
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator'; // We'll create this decorator next

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private roleService: RoleService,
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

    if (!user) {
        // Or handle as unauthorized if preferred
        throw new ForbiddenException('User not found in request for permission check.'); 
    }
    
    // Check if the user has ALL required permissions
    const hasPermissions = await this.roleService.hasAllPermissions(user, requiredPermissions);

    if (!hasPermissions) {
        throw new ForbiddenException(
            `User does not have the required permissions: ${requiredPermissions.join(', ')}`
        );
    }

    return true;
  }
} 