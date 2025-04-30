import { Module, forwardRef } from "@nestjs/common";
import { AdminController } from "./admin.controller";
import { AdminService } from "./admin.service";
import { UsersModule } from "../users/users.module";
import { DepartmentsModule } from "../departments/departments.module";
import { TasksModule } from "../tasks/tasks.module";
import { TypeOrmModule } from "@nestjs/typeorm";
import { User } from "../users/entities/user.entity";
import { Department } from "../departments/entities/department.entity";
import { Task } from "../tasks/entities/task.entity";
import { ActivityLog } from "./entities/activity-log.entity";
import { ActivityLogService } from "./services/activity-log.service";
import { ActivityLogsController } from "./controllers/activity-logs.controller";
import { AdminDepartmentsController } from "./controllers/admin-departments.controller";
import { ActivityLoggerInterceptorFactory } from "./interceptors/activity-logger.interceptor";

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Department, Task, ActivityLog]),
    forwardRef(() => UsersModule),
    forwardRef(() => DepartmentsModule),
    forwardRef(() => TasksModule),
  ],
  controllers: [
    AdminController,
    ActivityLogsController,
    AdminDepartmentsController,
  ],
  providers: [
    AdminService,
    ActivityLogService,
    ActivityLoggerInterceptorFactory,
  ],
  exports: [ActivityLogService, TypeOrmModule], // Export TypeOrmModule
})
export class AdminModule {}
