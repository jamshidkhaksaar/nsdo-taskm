import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'permissions';

/**
 * Decorator to set required permissions for a route handler or controller.
 * @param permissions List of permission names (e.g., 'task.create', 'user.edit.any')
 */
export const Permissions = (...permissions: string[]) => SetMetadata(PERMISSIONS_KEY, permissions); 