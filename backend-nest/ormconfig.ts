import { DataSource, DataSourceOptions } from 'typeorm';
import { User } from './src/users/entities/user.entity';
import { Department } from './src/departments/entities/department.entity';
import { Task } from './src/tasks/entities/task.entity';
import { Note } from './src/notes/entities/note.entity';
import { BackupSettings } from './src/settings/entities/backup-settings.entity';
import { NotificationSettings } from './src/settings/entities/notification-settings.entity';
import { SecuritySettings } from './src/settings/entities/security-settings.entity';
import { ActivityLog } from './src/admin/entities/activity-log.entity';
import { Backup } from './src/backup/entities/backup.entity';
import { Province } from './src/provinces/entities/province.entity';
import { Setting } from './src/settings/entities/setting.entity';

const config: DataSourceOptions = {
  type: 'mysql',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '3306', 10),
  username: process.env.DATABASE_USERNAME || 'root',
  password: process.env.DATABASE_PASSWORD || 'root',
  database: process.env.DATABASE_NAME || 'taskmanagement',
  synchronize: false,
  logging: false,
  entities: [
    User,
    Department,
    Task,
    Note,
    Setting,
    SecuritySettings,
    BackupSettings,
    NotificationSettings,
    ActivityLog,
    Backup,
    Province
  ],
  migrations: ['dist/migrations/*.js'],
};

export default config;