import { SetMetadata } from "@nestjs/common";

export const PERMISSIONS_KEY = "permissions";

/**
 * Decorator to attach required permissions to a route handler or controller.
 * @param permissions - The list of permission names (strings) required.
 */
export const Permissions = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
