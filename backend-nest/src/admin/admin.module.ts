import { Module, forwardRef } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { UsersModule } from '../users/users.module';
import { DepartmentsModule } from '../departments/departments.module';
import { TasksModule } from '../tasks/tasks.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { Department } from '../departments/entities/department.entity';
import { Task } from '../tasks/entities/task.entity';
import { ActivityLog } from './entities/activity-log.entity';
import { ActivityLogService } from './services/activity-log.service';
import { ActivityLogsController } from './controllers/activity-logs.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Department, Task, ActivityLog]),
    forwardRef(() => UsersModule),
    forwardRef(() => DepartmentsModule),
    // forwardRef(() => TasksModule), // TasksModule imports AdminModule, use forwardRef
  ],
  controllers: [AdminController, ActivityLogsController],
  providers: [AdminService, ActivityLogService],
  exports: [ActivityLogService, TypeOrmModule], // Export TypeOrmModule
})
export class AdminModule {} 