import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Remove explicit imports
/*
import { User } from '../dist/users/entities/user.entity';
import { Department } from '../dist/departments/entities/department.entity';
import { Task } from '../dist/tasks/entities/task.entity';
import { Note } from '../dist/notes/entities/note.entity';
import { ApiSettings } from '../dist/settings/entities/api-settings.entity';
import { BackupSettings } from '../dist/settings/entities/backup-settings.entity';
import { NotificationSettings } from '../dist/settings/entities/notification-settings.entity';
import { SecuritySettings } from '../dist/settings/entities/security-settings.entity';
import { Setting } from '../dist/settings/entities/setting.entity'; // New
import { ActivityLog } from '../dist/admin/entities/activity-log.entity';
import { Backup } from '../dist/backup/entities/backup.entity';
import { Province } from '../dist/provinces/entities/province.entity';
import { EmailTemplate } from '../dist/email-templates/entities/email-template.entity'; // New
*/

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '3306', 10),
  username: process.env.DATABASE_USERNAME || 'root',
  password: process.env.DATABASE_PASSWORD || 'root',
  database: process.env.DATABASE_NAME || 'taskmanagement',
  entities: ['dist/**/*.entity.js'], // Use glob pattern again
  // Remove explicit list
  /*
  entities: [
    User,
    Department,
    Task,
    Note,
    ApiSettings,
    BackupSettings,
    NotificationSettings,
    SecuritySettings,
    Setting, // New
    ActivityLog,
    Backup,
    Province,
    EmailTemplate, // New
  ],
  */
  migrations: ['dist/migrations/*.js'],
  synchronize: false,
  logging: true,
});

// Keep initialization block removed/commented

// Remove initialization logic from here; it should be handled by NestJS
// AppDataSource.initialize()
//   .then(() => {
//     console.log('Data Source has been initialized!');
//   })
//   .catch((err) => {
//     console.error('Error during Data Source initialization', err);
//   }); 