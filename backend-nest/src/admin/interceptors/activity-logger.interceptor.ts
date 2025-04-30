import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Inject,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { tap } from "rxjs/operators";
import { ActivityLogService } from "../services/activity-log.service";
import { ModuleRef } from "@nestjs/core";

interface LoggingConfig {
  action: string;
  target: string;
  details: string;
}

@Injectable()
export class ActivityLoggerInterceptor implements NestInterceptor {
  constructor(
    private readonly activityLogService: ActivityLogService,
    private readonly config: LoggingConfig,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { action, target, details } = this.config;
    const targetId = request.params?.id;

    // Process the request before the handler is executed
    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: (data) => {
          // Success case - log activity with success status
          this.activityLogService.logFromRequest(
            request,
            action,
            target,
            details,
            targetId,
            "success",
          );
        },
        error: (error) => {
          // Error case - log activity with error status
          this.activityLogService.logFromRequest(
            request,
            action,
            target,
            `${details} - Failed: ${error.message}`,
            targetId,
            "error",
          );
        },
      }),
    );
  }
}

// Factory provider to create ActivityLoggerInterceptor with the right dependencies
export const ActivityLoggerInterceptorFactory = {
  provide: "ACTIVITY_LOGGER_INTERCEPTOR",
  useFactory: (
    activityLogService: ActivityLogService,
    config: LoggingConfig = {
      action: "access",
      target: "resource",
      details: "Accessed resource",
    },
  ) => {
    return new ActivityLoggerInterceptor(activityLogService, config);
  },
  inject: [ActivityLogService],
};
