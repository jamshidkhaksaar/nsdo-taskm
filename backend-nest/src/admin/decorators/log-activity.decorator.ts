import { UseInterceptors, applyDecorators } from '@nestjs/common';
import { createActivityLogInterceptor } from '../interceptors/activity-logger.interceptor';
import { ActivityLogService } from '../services/activity-log.service';

/**
 * Decorator to log activities when controller methods are called
 * @param action The action being performed (e.g., 'create', 'update', 'delete')
 * @param target The target entity (e.g., 'user', 'task', 'department')
 * @param details Description of the activity
 */
export function LogActivity(action: string, target: string, details: string) {
  // Return a method decorator factory to get access to the ActivityLogService
  return (target: any, key: string, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value;
    
    descriptor.value = function(...args: any[]) {
      // Get the ActivityLogService from the class instance
      const activityLogService = (this as any).activityLogService;
      
      if (!activityLogService) {
        console.warn('ActivityLogService not found in controller. Activity will not be logged.');
        return originalMethod.apply(this, args);
      }
      
      // Apply the interceptor
      UseInterceptors(createActivityLogInterceptor(
        { action, target, details }, 
        activityLogService
      ))(target, key, descriptor);
      
      return originalMethod.apply(this, args);
    };
    
    return descriptor;
  };
} 