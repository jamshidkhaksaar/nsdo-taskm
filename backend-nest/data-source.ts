import { DataSource, DataSourceOptions } from 'typeorm';
import { User } from './src/users/entities/user.entity';
import { Department } from './src/departments/entities/department.entity';
import { Task } from './src/tasks/entities/task.entity';
import { Note } from './src/notes/entities/note.entity';
import { Province } from './src/provinces/entities/province.entity';
import { Notification } from './src/notifications/entities/notification.entity';
import { ApiSettings } from './src/settings/entities/api-settings.entity';
import { BackupSettings } from './src/settings/entities/backup-settings.entity';
import { NotificationSettings } from './src/settings/entities/notification-settings.entity';
import { SecuritySettings } from './src/settings/entities/security-settings.entity';
import { ActivityLog } from './src/admin/entities/activity-log.entity';
import { Backup } from './src/backup/entities/backup.entity';

// Load environment variables if needed (e.g., using dotenv)
// import * as dotenv from 'dotenv';
// dotenv.config(); 

export const dataSourceOptions: DataSourceOptions = {
  type: 'mysql', // Or process.env.DB_TYPE
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  username: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_DATABASE || 'taskmanagement',
  synchronize: false, // IMPORTANT: Should be false for migrations
  logging: false,
  entities: [
    User,
    Department,
    Task,
    Note,
    Province,
    Notification,
    ApiSettings,
    BackupSettings,
    NotificationSettings,
    SecuritySettings,
    ActivityLog,
    Backup,
  ],
  migrations: ['src/migrations/*.ts'], // Point to TS migration files
  migrationsTableName: "typeorm_migrations",
  // cli: { 
  //   migrationsDir: 'src/migrations' // Optional: specify directory for CLI
  // }
};

const dataSource = new DataSource(dataSourceOptions);
export default dataSource; 