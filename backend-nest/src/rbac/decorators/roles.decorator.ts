import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

/**
 * Decorator to attach required role names to a route handler or controller.
 * @param roles - The list of role names (strings) required. Access is granted if the user has ANY of these roles.
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles); 