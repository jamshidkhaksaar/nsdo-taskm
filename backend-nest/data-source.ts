import "reflect-metadata";
import { DataSource, DataSourceOptions } from 'typeorm';
import { User } from './src/users/entities/user.entity';
import { Department } from './src/departments/entities/department.entity';
import { Task } from './src/tasks/entities/task.entity';
import { Note } from './src/notes/entities/note.entity';
import { Province } from './src/provinces/entities/province.entity';
import { Notification } from './src/notifications/entities/notification.entity';
import { NotificationSettings } from './src/settings/entities/notification-settings.entity';
import { SecuritySettings } from './src/settings/entities/security-settings.entity';
import { Setting } from './src/settings/entities/setting.entity';
import { ActivityLog } from './src/admin/entities/activity-log.entity';
import { Backup } from './src/backup/entities/backup.entity';
import { EmailTemplate } from './src/email-templates/entities/email-template.entity';
import { Role } from './src/rbac/entities/role.entity';
import { Permission } from './src/rbac/entities/permission.entity';
import { BackupSettings } from './src/settings/entities/backup-settings.entity';

// Load environment variables if needed (e.g., using dotenv)
// import * as dotenv from 'dotenv';
// dotenv.config(); 

export const AppDataSourceOptions: DataSourceOptions = {
  type: 'mysql', // Or process.env.DB_TYPE
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  username: process.env.DB_USERNAME || 'nsdopqrj_nsdo',
  password: process.env.DB_PASSWORD || 'Hg[Yp-6hXrjZ',
  database: process.env.DB_DATABASE || 'nsdopqrj_task_management',
  synchronize: true, // IMPORTANT: Should be false for migrations
  logging: true,
  entities: [
    User,
    Department,
    Task,
    Note,
    Province,
    Notification,
    NotificationSettings,
    SecuritySettings,
    Setting,
    ActivityLog,
    Backup,
    EmailTemplate,
    Role,
    Permission,
    BackupSettings,
  ],
  migrations: ['src/migrations/*.ts'], // Point to TS migration files
  migrationsTableName: "typeorm_migrations",
  // cli: { 
  //   migrationsDir: 'src/migrations' // Optional: specify directory for CLI
  // }
};

const AppDataSource = new DataSource(AppDataSourceOptions);
export default AppDataSource; 