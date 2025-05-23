import { Module, forwardRef } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Task } from "./entities/task.entity";
import { TasksController } from "./tasks.controller";
import { TasksService } from "./tasks.service";
import { TaskQueryService } from "./task-query.service";
import { UsersModule } from "../users/users.module";
import { DepartmentsModule } from "../departments/departments.module";
import { ProvinceModule } from "../provinces/province.module";
import { AdminModule } from "../admin/admin.module";
import { ActivityLog } from "../admin/entities/activity-log.entity";
import { MailModule } from "../mail/mail.module";
import { ConfigModule } from "@nestjs/config";
import { User } from "../users/entities/user.entity";
import { Department } from "../departments/entities/department.entity";
import { Province } from "../provinces/entities/province.entity";
import { RbacModule } from "../rbac/rbac.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([Task, User, Department, Province, ActivityLog]),
    forwardRef(() => UsersModule),
    forwardRef(() => DepartmentsModule),
    forwardRef(() => ProvinceModule),
    forwardRef(() => AdminModule),
    MailModule,
    ConfigModule,
    RbacModule,
  ],
  controllers: [TasksController],
  providers: [TasksService, TaskQueryService],
  exports: [TypeOrmModule, TasksService, TaskQueryService],
})
export class TasksModule {}
