const { DataSource } = require('typeorm');
const { User } = require('./dist/src/users/entities/user.entity');
const { Department } = require('./dist/src/departments/entities/department.entity');
const { Task } = require('./dist/src/tasks/entities/task.entity');
const { Note } = require('./dist/src/notes/entities/note.entity');
const { Province } = require('./dist/src/provinces/entities/province.entity');
const { ApiSettings } = require('./dist/src/settings/entities/api-settings.entity');
const { BackupSettings } = require('./dist/src/settings/entities/backup-settings.entity');
const { NotificationSettings } = require('./dist/src/settings/entities/notification-settings.entity');
const { SecuritySettings } = require('./dist/src/settings/entities/security-settings.entity');
const { ActivityLog } = require('./dist/src/admin/entities/activity-log.entity');
const { Backup } = require('./dist/src/backup/entities/backup.entity');
const { EmailTemplate } = require('./dist/src/email-templates/entities/email-template.entity');

module.exports = new DataSource({
  type: 'mysql',
  host: 'localhost',
  port: 3306,
  username: 'root',
  password: 'root',
  database: 'taskmanagement',
  synchronize: false,
  logging: false,
  entities: [
    User,
    Department,
    Task,
    Note,
    Province,
    ApiSettings,
    BackupSettings,
    NotificationSettings,
    SecuritySettings,
    ActivityLog,
    Backup,
    EmailTemplate,
  ],
  migrations: ['src/migrations/*.ts'],
  migrationsTableName: "typeorm_migrations",
});