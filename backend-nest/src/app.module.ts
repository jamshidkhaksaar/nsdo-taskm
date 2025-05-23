import { Module, MiddlewareConsumer, NestModule } from "@nestjs/common";
import { HealthController } from "./health/health.controller";
import { CacheModule } from "@nestjs/cache-manager";
import { TerminusModule } from "@nestjs/terminus";
import { BullModule } from "@nestjs/bull";
import { ThrottlerModule, ThrottlerGuard } from "@nestjs/throttler";
import { APP_GUARD } from "@nestjs/core";
import { IpWhitelistMiddleware } from "./ip-whitelist.middleware";
import { DefaultQueueProcessor } from "./queue/queue.processor";
import { GlobalThrottlerGuard } from "./throttler.guard";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthModule } from "./auth/auth.module";
import { UsersModule } from "./users/users.module";
import { DepartmentsModule } from "./departments/departments.module";
import { AdminModule } from "./admin/admin.module";
import { TasksModule } from "./tasks/tasks.module";
import { SettingsModule } from "./settings/settings.module";
import { BackupModule } from "./backup/backup.module";
import { ProfileModule } from "./profile/profile.module";
import { MailModule } from "./mail/mail.module";
import { NotesModule } from "./notes/notes.module";
import { Notification } from "./notifications/entities/notification.entity";
import { AnalyticsModule } from "./analytics/analytics.module";
import { CaptchaModule } from "./captcha/captcha.module";
import { Province } from "./provinces/entities/province.entity";
import { EmailTemplate } from "./email-templates/entities/email-template.entity";
import { ProvinceModule } from "./provinces/province.module";
import { EmailTemplatesModule } from "./email-templates/email-templates.module";
import { NotificationsModule } from "./notifications/notifications.module";
import { RbacModule } from "./rbac/rbac.module";
import { SecuritySettings } from "./settings/entities/security-settings.entity";
import { BackupSettings } from "./settings/entities/backup-settings.entity";
import { NotificationSettings } from "./settings/entities/notification-settings.entity";

// Import all entity classes directly
import { User } from "./users/entities/user.entity";
import { Department } from "./departments/entities/department.entity";
import { Task } from "./tasks/entities/task.entity";
import { Note } from "./notes/entities/note.entity";
import { Setting } from "./settings/entities/setting.entity";
import { ActivityLog } from "./admin/entities/activity-log.entity";
import { Backup } from "./backup/entities/backup.entity";
import { Role } from "./rbac/entities/role.entity";
import { Permission } from "./rbac/entities/permission.entity";

// Import new workflow entities
import { Workflow } from "./admin/workflows/entities/workflow.entity";
import { WorkflowStep } from "./admin/workflows/entities/workflow-step.entity";
import { RoleWorkflowStepPermission } from "./admin/workflows/entities/role-workflow-step-permission.entity";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        // In development mode, enable synchronize to create tables
        const isDevelopment = configService.get("NODE_ENV") === "development";
        console.log(
          `Database synchronization: ${isDevelopment || configService.get("DATABASE_SYNC") === "true"}`,
        );

        return {
          type: "mysql",
          host: configService.get("DATABASE_HOST"),
          port: +configService.get("DATABASE_PORT"),
          username: configService.get("DATABASE_USERNAME"),
          password: configService.get("DATABASE_PASSWORD"),
          database: configService.get("DATABASE_NAME"),
          entities: [
            User,
            Department,
            Task,
            Note,
            BackupSettings,
            NotificationSettings,
            SecuritySettings,
            Setting,
            ActivityLog,
            Backup,
            Province,
            EmailTemplate,
            Notification,
            Role,
            Permission,
            Workflow,
            WorkflowStep,
            RoleWorkflowStepPermission,
          ],
          synchronize:
            isDevelopment || configService.get("DATABASE_SYNC") === "true",
          logging: true,
        };
      },
    }),
    CacheModule.register({
      ttl: 60, // seconds
      isGlobal: true,
    }),
    AuthModule,
    ThrottlerModule.forRoot(),
    UsersModule,
    DepartmentsModule,
    AdminModule,
    TasksModule,
    SettingsModule,
    BackupModule,
    ProfileModule,
    MailModule,
    NotesModule,
    AnalyticsModule,
    TerminusModule,
    ProvinceModule,
    EmailTemplatesModule,
    NotificationsModule,
    CaptchaModule,
    RbacModule,
  ],
  controllers: [AppController, HealthController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: GlobalThrottlerGuard,
    },
    DefaultQueueProcessor,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(IpWhitelistMiddleware).forRoutes("admin");
  }
}
