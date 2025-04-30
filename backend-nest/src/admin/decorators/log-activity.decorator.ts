import { UseInterceptors, applyDecorators } from "@nestjs/common";
import { ActivityLogService } from "../services/activity-log.service";

/**
 * Decorator to log activities when controller methods are called
 * @param action The action being performed (e.g., 'create', 'update', 'delete')
 * @param target The target entity (e.g., 'user', 'task', 'department')
 * @param details Description of the activity
 */
export function LogActivity(action: string, target: string, details: string) {
  // Return a method decorator factory
  return (target: any, key: string, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      // Get the ActivityLogService from the class instance
      const activityLogService = this.activityLogService;

      if (!activityLogService) {
        console.warn(
          "ActivityLogService not found in controller. Activity will not be logged.",
        );
        return originalMethod.apply(this, args);
      }

      // Find the request object in args
      const request = args.find(
        (arg) => arg && typeof arg === "object" && "headers" in arg,
      );

      // Find potential ID parameter
      let targetId = null;
      for (const arg of args) {
        if (arg && typeof arg === "object" && arg.id) {
          targetId = arg.id;
          break;
        }
      }

      // Execute the original method
      const result = await originalMethod.apply(this, args);

      // Log the activity if we have a request object
      if (request && activityLogService.logFromRequest) {
        try {
          await activityLogService.logFromRequest(
            request,
            action,
            target,
            details,
            targetId,
          );
        } catch (error) {
          console.error("Failed to log activity:", error);
        }
      }

      return result;
    };

    return descriptor;
  };
}
