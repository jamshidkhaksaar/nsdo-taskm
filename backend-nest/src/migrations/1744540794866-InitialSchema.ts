import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1744540794866 implements MigrationInterface {
    name = 'InitialSchema1744540794866'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`province\` (\`id\` varchar(36) NOT NULL, \`name\` varchar(255) NOT NULL, \`description\` varchar(255) NULL, UNIQUE INDEX \`IDX_aa290c4049a8aa685a81483389\` (\`name\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`department\` (\`id\` varchar(36) NOT NULL, \`name\` varchar(255) NOT NULL, \`description\` varchar(255) NULL, \`headId\` varchar(255) NULL, \`provinceId\` varchar(255) NULL, \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, \`updatedAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, UNIQUE INDEX \`IDX_471da4b90e96c1ebe0af221e07\` (\`name\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`task\` (\`id\` varchar(36) NOT NULL, \`title\` varchar(255) NOT NULL, \`description\` varchar(255) NOT NULL, \`status\` enum ('pending', 'in_progress', 'completed', 'cancelled') NOT NULL DEFAULT 'pending', \`priority\` enum ('low', 'medium', 'high') NOT NULL DEFAULT 'medium', \`type\` enum ('personal', 'department', 'user', 'province_department') NOT NULL, \`is_private\` tinyint NOT NULL DEFAULT 0, \`dueDate\` datetime NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`createdById\` varchar(255) NOT NULL, \`assignedToProvinceId\` varchar(255) NULL, \`isDelegated\` tinyint NOT NULL DEFAULT 0, \`delegatedByUserId\` varchar(255) NULL, \`delegatedFromTaskId\` varchar(255) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`note\` (\`id\` varchar(36) NOT NULL, \`content\` text NOT NULL, \`color\` varchar(50) NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`userId\` varchar(255) NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`user\` (\`id\` varchar(36) NOT NULL, \`username\` varchar(255) NOT NULL, \`email\` varchar(255) NOT NULL, \`password\` varchar(255) NOT NULL, \`role\` enum ('user', 'manager', 'general_manager', 'admin') NOT NULL DEFAULT 'user', \`isActive\` tinyint NOT NULL DEFAULT 1, \`twoFactorEnabled\` tinyint NOT NULL DEFAULT 0, \`twoFactorSecret\` varchar(255) NULL, \`twoFactorMethod\` varchar(255) NOT NULL DEFAULT 'app', \`rememberedBrowsers\` json NULL, \`bio\` text NULL, \`avatarUrl\` varchar(255) NULL, \`skills\` text NULL, \`socialLinks\` json NULL, \`preferences\` json NULL, \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, \`updatedAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, UNIQUE INDEX \`IDX_78a916df40e02a9deb1c4b75ed\` (\`username\`), UNIQUE INDEX \`IDX_e12875dfb3b1d92d7d7c5377e2\` (\`email\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`notifications\` (\`id\` varchar(36) NOT NULL, \`message\` varchar(255) NOT NULL, \`type\` enum ('task_created', 'task_assigned', 'task_status_changed', 'collaborator_added', 'task_due_soon', 'task_overdue') NOT NULL DEFAULT 'task_assigned', \`read\` tinyint NOT NULL DEFAULT 0, \`user_id\` varchar(255) NOT NULL, \`task_id\` varchar(255) NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`api_settings\` (\`id\` int NOT NULL AUTO_INCREMENT, \`api_enabled\` tinyint NOT NULL DEFAULT 1, \`api_key\` varchar(255) NULL, \`weather_api_enabled\` tinyint NOT NULL DEFAULT 0, \`weather_api_key\` varchar(255) NULL, \`api_rate_limit\` int NOT NULL DEFAULT '100', \`api_allowed_ips\` varchar(255) NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`backup_settings\` (\`id\` int NOT NULL AUTO_INCREMENT, \`auto_backup_enabled\` tinyint NOT NULL DEFAULT 1, \`backup_frequency_hours\` int NOT NULL DEFAULT '24', \`backup_retention_days\` int NOT NULL DEFAULT '30', \`backup_location\` varchar(255) NOT NULL DEFAULT '/backups', \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`notification_settings\` (\`id\` int NOT NULL AUTO_INCREMENT, \`email_notifications_enabled\` tinyint NOT NULL DEFAULT 1, \`smtp_server\` varchar(255) NOT NULL DEFAULT 'smtp.example.com', \`smtp_port\` int NOT NULL DEFAULT '587', \`smtp_username\` varchar(255) NOT NULL DEFAULT 'notifications@example.com', \`smtp_password\` varchar(255) NULL, \`smtp_use_tls\` tinyint NOT NULL DEFAULT 1, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`security_settings\` (\`id\` int NOT NULL AUTO_INCREMENT, \`two_factor_enabled\` tinyint NOT NULL DEFAULT 0, \`password_expiry_days\` int NOT NULL DEFAULT '90', \`max_login_attempts\` int NOT NULL DEFAULT '5', \`lockout_duration_minutes\` int NOT NULL DEFAULT '30', \`password_complexity_required\` tinyint NOT NULL DEFAULT 1, \`session_timeout_minutes\` int NOT NULL DEFAULT '60', \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`activity_log\` (\`id\` varchar(36) NOT NULL, \`user_id\` varchar(255) NULL, \`action\` varchar(255) NOT NULL, \`target\` varchar(255) NOT NULL, \`target_id\` varchar(255) NULL, \`details\` varchar(255) NOT NULL, \`ip_address\` varchar(255) NULL, \`status\` enum ('success', 'warning', 'error') NOT NULL DEFAULT 'success', \`timestamp\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`backups\` (\`id\` varchar(255) NOT NULL, \`name\` varchar(255) NOT NULL, \`timestamp\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`size\` varchar(255) NOT NULL, \`type\` enum ('full', 'partial') NOT NULL DEFAULT 'full', \`status\` enum ('completed', 'in_progress', 'failed') NOT NULL DEFAULT 'in_progress', \`notes\` varchar(255) NULL, \`error_message\` varchar(255) NULL, \`file_path\` varchar(255) NULL, \`is_deleted\` tinyint NOT NULL DEFAULT 0, \`created_by_id\` varchar(36) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`department_members\` (\`department_id\` varchar(36) NOT NULL, \`user_id\` varchar(36) NOT NULL, INDEX \`IDX_7d7af06fba109a8730e533c3e8\` (\`department_id\`), INDEX \`IDX_204f19d27111f77b67167bfa56\` (\`user_id\`), PRIMARY KEY (\`department_id\`, \`user_id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`department_heads\` (\`department_id\` varchar(36) NOT NULL, \`head_id\` varchar(36) NOT NULL, INDEX \`IDX_28f10031f811c9402e0c75bb80\` (\`department_id\`), INDEX \`IDX_51eea3aae1c92716d3af441d9e\` (\`head_id\`), PRIMARY KEY (\`department_id\`, \`head_id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`task_user_assignees\` (\`task_id\` varchar(36) NOT NULL, \`user_id\` varchar(36) NOT NULL, INDEX \`IDX_1fcc07cf7a8aeca3ff133259ff\` (\`task_id\`), INDEX \`IDX_84efb7c2c1f00ffa656bccb6b8\` (\`user_id\`), PRIMARY KEY (\`task_id\`, \`user_id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`task_department_assignees\` (\`task_id\` varchar(36) NOT NULL, \`department_id\` varchar(36) NOT NULL, INDEX \`IDX_730107914e62685db17eceb53c\` (\`task_id\`), INDEX \`IDX_4ea92597931990089d7f1a9110\` (\`department_id\`), PRIMARY KEY (\`task_id\`, \`department_id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`user_departments\` (\`user_id\` varchar(36) NOT NULL, \`department_id\` varchar(36) NOT NULL, INDEX \`IDX_78098f9a7c51985e96b5326bca\` (\`user_id\`), INDEX \`IDX_f10514cebc5e624f08c1b55808\` (\`department_id\`), PRIMARY KEY (\`user_id\`, \`department_id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`department\` ADD CONSTRAINT \`FK_88efd63ca0d064ae4d5dda8d47b\` FOREIGN KEY (\`provinceId\`) REFERENCES \`province\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`task\` ADD CONSTRAINT \`FK_91d76dd2ae372b9b7dfb6bf3fd2\` FOREIGN KEY (\`createdById\`) REFERENCES \`user\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`task\` ADD CONSTRAINT \`FK_87d208e99a0edf827688bb2d123\` FOREIGN KEY (\`assignedToProvinceId\`) REFERENCES \`province\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`task\` ADD CONSTRAINT \`FK_86ec16208c1d4ac14af7368bd01\` FOREIGN KEY (\`delegatedByUserId\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`task\` ADD CONSTRAINT \`FK_45393b7c8d0d02c3a8505807690\` FOREIGN KEY (\`delegatedFromTaskId\`) REFERENCES \`task\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`note\` ADD CONSTRAINT \`FK_5b87d9d19127bd5d92026017a7b\` FOREIGN KEY (\`userId\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`notifications\` ADD CONSTRAINT \`FK_9a8a82462cab47c73d25f49261f\` FOREIGN KEY (\`user_id\`) REFERENCES \`user\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`notifications\` ADD CONSTRAINT \`FK_b4a7cd30c9f4ca1b23ef0eb6dd8\` FOREIGN KEY (\`task_id\`) REFERENCES \`task\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`activity_log\` ADD CONSTRAINT \`FK_81615294532ca4b6c70abd1b2e6\` FOREIGN KEY (\`user_id\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`backups\` ADD CONSTRAINT \`FK_dd12c30eaa21888695759b027a3\` FOREIGN KEY (\`created_by_id\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`department_members\` ADD CONSTRAINT \`FK_7d7af06fba109a8730e533c3e8d\` FOREIGN KEY (\`department_id\`) REFERENCES \`department\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE \`department_members\` ADD CONSTRAINT \`FK_204f19d27111f77b67167bfa566\` FOREIGN KEY (\`user_id\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`department_heads\` ADD CONSTRAINT \`FK_28f10031f811c9402e0c75bb80d\` FOREIGN KEY (\`department_id\`) REFERENCES \`department\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE \`department_heads\` ADD CONSTRAINT \`FK_51eea3aae1c92716d3af441d9e5\` FOREIGN KEY (\`head_id\`) REFERENCES \`user\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE \`task_user_assignees\` ADD CONSTRAINT \`FK_1fcc07cf7a8aeca3ff133259ff2\` FOREIGN KEY (\`task_id\`) REFERENCES \`task\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE \`task_user_assignees\` ADD CONSTRAINT \`FK_84efb7c2c1f00ffa656bccb6b8c\` FOREIGN KEY (\`user_id\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`task_department_assignees\` ADD CONSTRAINT \`FK_730107914e62685db17eceb53c4\` FOREIGN KEY (\`task_id\`) REFERENCES \`task\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE \`task_department_assignees\` ADD CONSTRAINT \`FK_4ea92597931990089d7f1a91103\` FOREIGN KEY (\`department_id\`) REFERENCES \`department\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`user_departments\` ADD CONSTRAINT \`FK_78098f9a7c51985e96b5326bca9\` FOREIGN KEY (\`user_id\`) REFERENCES \`user\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE \`user_departments\` ADD CONSTRAINT \`FK_f10514cebc5e624f08c1b558081\` FOREIGN KEY (\`department_id\`) REFERENCES \`department\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`user_departments\` DROP FOREIGN KEY \`FK_f10514cebc5e624f08c1b558081\``);
        await queryRunner.query(`ALTER TABLE \`user_departments\` DROP FOREIGN KEY \`FK_78098f9a7c51985e96b5326bca9\``);
        await queryRunner.query(`ALTER TABLE \`task_department_assignees\` DROP FOREIGN KEY \`FK_4ea92597931990089d7f1a91103\``);
        await queryRunner.query(`ALTER TABLE \`task_department_assignees\` DROP FOREIGN KEY \`FK_730107914e62685db17eceb53c4\``);
        await queryRunner.query(`ALTER TABLE \`task_user_assignees\` DROP FOREIGN KEY \`FK_84efb7c2c1f00ffa656bccb6b8c\``);
        await queryRunner.query(`ALTER TABLE \`task_user_assignees\` DROP FOREIGN KEY \`FK_1fcc07cf7a8aeca3ff133259ff2\``);
        await queryRunner.query(`ALTER TABLE \`department_heads\` DROP FOREIGN KEY \`FK_51eea3aae1c92716d3af441d9e5\``);
        await queryRunner.query(`ALTER TABLE \`department_heads\` DROP FOREIGN KEY \`FK_28f10031f811c9402e0c75bb80d\``);
        await queryRunner.query(`ALTER TABLE \`department_members\` DROP FOREIGN KEY \`FK_204f19d27111f77b67167bfa566\``);
        await queryRunner.query(`ALTER TABLE \`department_members\` DROP FOREIGN KEY \`FK_7d7af06fba109a8730e533c3e8d\``);
        await queryRunner.query(`ALTER TABLE \`backups\` DROP FOREIGN KEY \`FK_dd12c30eaa21888695759b027a3\``);
        await queryRunner.query(`ALTER TABLE \`activity_log\` DROP FOREIGN KEY \`FK_81615294532ca4b6c70abd1b2e6\``);
        await queryRunner.query(`ALTER TABLE \`notifications\` DROP FOREIGN KEY \`FK_b4a7cd30c9f4ca1b23ef0eb6dd8\``);
        await queryRunner.query(`ALTER TABLE \`notifications\` DROP FOREIGN KEY \`FK_9a8a82462cab47c73d25f49261f\``);
        await queryRunner.query(`ALTER TABLE \`note\` DROP FOREIGN KEY \`FK_5b87d9d19127bd5d92026017a7b\``);
        await queryRunner.query(`ALTER TABLE \`task\` DROP FOREIGN KEY \`FK_45393b7c8d0d02c3a8505807690\``);
        await queryRunner.query(`ALTER TABLE \`task\` DROP FOREIGN KEY \`FK_86ec16208c1d4ac14af7368bd01\``);
        await queryRunner.query(`ALTER TABLE \`task\` DROP FOREIGN KEY \`FK_87d208e99a0edf827688bb2d123\``);
        await queryRunner.query(`ALTER TABLE \`task\` DROP FOREIGN KEY \`FK_91d76dd2ae372b9b7dfb6bf3fd2\``);
        await queryRunner.query(`ALTER TABLE \`department\` DROP FOREIGN KEY \`FK_88efd63ca0d064ae4d5dda8d47b\``);
        await queryRunner.query(`DROP INDEX \`IDX_f10514cebc5e624f08c1b55808\` ON \`user_departments\``);
        await queryRunner.query(`DROP INDEX \`IDX_78098f9a7c51985e96b5326bca\` ON \`user_departments\``);
        await queryRunner.query(`DROP TABLE \`user_departments\``);
        await queryRunner.query(`DROP INDEX \`IDX_4ea92597931990089d7f1a9110\` ON \`task_department_assignees\``);
        await queryRunner.query(`DROP INDEX \`IDX_730107914e62685db17eceb53c\` ON \`task_department_assignees\``);
        await queryRunner.query(`DROP TABLE \`task_department_assignees\``);
        await queryRunner.query(`DROP INDEX \`IDX_84efb7c2c1f00ffa656bccb6b8\` ON \`task_user_assignees\``);
        await queryRunner.query(`DROP INDEX \`IDX_1fcc07cf7a8aeca3ff133259ff\` ON \`task_user_assignees\``);
        await queryRunner.query(`DROP TABLE \`task_user_assignees\``);
        await queryRunner.query(`DROP INDEX \`IDX_51eea3aae1c92716d3af441d9e\` ON \`department_heads\``);
        await queryRunner.query(`DROP INDEX \`IDX_28f10031f811c9402e0c75bb80\` ON \`department_heads\``);
        await queryRunner.query(`DROP TABLE \`department_heads\``);
        await queryRunner.query(`DROP INDEX \`IDX_204f19d27111f77b67167bfa56\` ON \`department_members\``);
        await queryRunner.query(`DROP INDEX \`IDX_7d7af06fba109a8730e533c3e8\` ON \`department_members\``);
        await queryRunner.query(`DROP TABLE \`department_members\``);
        await queryRunner.query(`DROP TABLE \`backups\``);
        await queryRunner.query(`DROP TABLE \`activity_log\``);
        await queryRunner.query(`DROP TABLE \`security_settings\``);
        await queryRunner.query(`DROP TABLE \`notification_settings\``);
        await queryRunner.query(`DROP TABLE \`backup_settings\``);
        await queryRunner.query(`DROP TABLE \`api_settings\``);
        await queryRunner.query(`DROP TABLE \`notifications\``);
        await queryRunner.query(`DROP INDEX \`IDX_e12875dfb3b1d92d7d7c5377e2\` ON \`user\``);
        await queryRunner.query(`DROP INDEX \`IDX_78a916df40e02a9deb1c4b75ed\` ON \`user\``);
        await queryRunner.query(`DROP TABLE \`user\``);
        await queryRunner.query(`DROP TABLE \`note\``);
        await queryRunner.query(`DROP TABLE \`task\``);
        await queryRunner.query(`DROP INDEX \`IDX_471da4b90e96c1ebe0af221e07\` ON \`department\``);
        await queryRunner.query(`DROP TABLE \`department\``);
        await queryRunner.query(`DROP INDEX \`IDX_aa290c4049a8aa685a81483389\` ON \`province\``);
        await queryRunner.query(`DROP TABLE \`province\``);
    }

}
