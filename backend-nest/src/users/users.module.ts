import { Module, forwardRef } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { User } from "./entities/user.entity";
import { UsersService } from "./users.service";
import { UsersController } from "./users.controller";
import { AdminModule } from "../admin/admin.module";
import { TasksModule } from "../tasks/tasks.module";
import { MailModule } from "../mail/mail.module";
import { ConfigModule } from "@nestjs/config";
import { RbacModule } from "../rbac/rbac.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    forwardRef(() => AdminModule), // Use forwardRef to avoid circular dependency
    forwardRef(() => TasksModule), // Add TasksModule import with forwardRef
    MailModule,
    ConfigModule,
    forwardRef(() => RbacModule), // Import RbacModule with forwardRef
  ],
  providers: [UsersService],
  controllers: [UsersController],
  exports: [UsersService, TypeOrmModule],
})
export class UsersModule {}
