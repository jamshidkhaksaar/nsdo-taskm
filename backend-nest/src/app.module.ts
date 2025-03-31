import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { DepartmentsModule } from './departments/departments.module';
import { AdminModule } from './admin/admin.module';
import { TasksModule } from './tasks/tasks.module';
import { SettingsModule } from './settings/settings.module';
import { BackupModule } from './backup/backup.module';
import { ProfileModule } from './profile/profile.module';
import { MailModule } from './mail/mail.module';
import { NotesModule } from './notes/notes.module';

// Import all entity classes directly
import { User } from './users/entities/user.entity';
import { Department } from './departments/entities/department.entity';
import { Task } from './tasks/entities/task.entity';
import { Note } from './notes/entities/note.entity';
import { ApiSettings } from './settings/entities/api-settings.entity';
import { BackupSettings } from './settings/entities/backup-settings.entity';
import { NotificationSettings } from './settings/entities/notification-settings.entity';
import { SecuritySettings } from './settings/entities/security-settings.entity';
import { ActivityLog } from './admin/entities/activity-log.entity';
import { Backup } from './backup/entities/backup.entity';
import { AnalyticsModule } from './analytics/analytics.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get('DATABASE_HOST'),
        port: +configService.get('DATABASE_PORT'),
        username: configService.get('DATABASE_USERNAME'),
        password: configService.get('DATABASE_PASSWORD'),
        database: configService.get('DATABASE_NAME'),
        entities: [
          User,
          Department,
          Task,
          Note,
          ApiSettings,
          BackupSettings,
          NotificationSettings,
          SecuritySettings,
          ActivityLog,
          Backup
        ],
        synchronize: configService.get('DATABASE_SYNC') === 'true',
      }),
    }),
    AuthModule,
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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
