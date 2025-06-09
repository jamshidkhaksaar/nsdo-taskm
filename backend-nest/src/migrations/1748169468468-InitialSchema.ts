import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1748169468468 implements MigrationInterface {
    name = 'InitialSchema1748169468468'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`permissions\` (\`id\` varchar(36) NOT NULL, \`name\` varchar(100) NOT NULL, \`description\` text NULL, \`group\` varchar(50) NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_48ce552495d14eae9b187bb671\` (\`name\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`roles\` (\`id\` varchar(36) NOT NULL, \`name\` varchar(50) NOT NULL, \`description\` text NULL, \`is_system_role\` tinyint NOT NULL DEFAULT 0, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_648e3f5447f725579d7d4ffdfb\` (\`name\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`user\` (\`id\` varchar(36) NOT NULL, \`username\` varchar(255) NOT NULL, \`email\` varchar(255) NOT NULL, \`password\` varchar(255) NOT NULL, \`isActive\` tinyint NOT NULL DEFAULT 1, \`two_factor_enabled\` tinyint NOT NULL DEFAULT 0, \`two_factor_secret\` text NULL, \`login_otp\` varchar(10) NULL, \`login_otp_expires_at\` timestamp NULL, \`reset_password_token\` varchar(128) NULL, \`reset_password_expires\` timestamp NULL, \`position\` varchar(255) NULL, \`two_factor_method\` varchar(255) NOT NULL DEFAULT 'app', \`remembered_browsers\` json NULL, \`failed_two_factor_attempts\` int NOT NULL DEFAULT '0', \`two_factor_lockout_until\` timestamp NULL, \`bio\` text NULL, \`avatar_url\` varchar(255) NULL, \`skills\` text NULL, \`social_links\` json NULL, \`preferences\` json NULL, \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, \`deleted_at\` timestamp(6) NULL, \`role_id\` varchar(36) NULL, UNIQUE INDEX \`IDX_78a916df40e02a9deb1c4b75ed\` (\`username\`), UNIQUE INDEX \`IDX_e12875dfb3b1d92d7d7c5377e2\` (\`email\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`notification_settings\` (\`id\` int NOT NULL AUTO_INCREMENT, \`email_notifications_enabled\` tinyint NOT NULL DEFAULT 1, \`smtp_server\` varchar(255) NOT NULL DEFAULT 'smtp.example.com', \`smtp_port\` int NOT NULL DEFAULT '587', \`smtp_username\` varchar(255) NOT NULL DEFAULT 'notifications@example.com', \`smtp_password\` varchar(255) NULL, \`smtp_use_tls\` tinyint NOT NULL DEFAULT 1, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`backup_settings\` (\`id\` int NOT NULL AUTO_INCREMENT, \`auto_backup_enabled\` tinyint NOT NULL DEFAULT 1, \`backup_frequency_hours\` int NOT NULL DEFAULT '24', \`backup_retention_days\` int NOT NULL DEFAULT '30', \`backup_location\` varchar(255) NOT NULL DEFAULT '/backups', \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`settings\` (\`key\` varchar(50) NOT NULL, \`value\` text NOT NULL, \`description\` text NULL, \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`key\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`security_settings\` (\`id\` int NOT NULL AUTO_INCREMENT, \`two_factor_enabled\` tinyint NOT NULL DEFAULT 0, \`two_factor_device_remembrance_days\` int NOT NULL DEFAULT '30', \`two_factor_max_failed_attempts\` int NOT NULL DEFAULT '5', \`password_expiry_days\` int NOT NULL DEFAULT '90', \`max_login_attempts\` int NOT NULL DEFAULT '5', \`lockout_duration_minutes\` int NOT NULL DEFAULT '30', \`password_complexity_required\` tinyint NOT NULL DEFAULT 1, \`session_timeout_minutes\` int NOT NULL DEFAULT '60', \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`notifications\` (\`id\` varchar(36) NOT NULL, \`type\` enum ('task_assigned', 'task_updated', 'task_status_changed', 'task_priority_changed', 'task_delegated', 'task_delegation_notice', 'mention', 'system') NOT NULL, \`message\` text NOT NULL, \`isRead\` tinyint NOT NULL DEFAULT 0, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`user_id\` varchar(255) NOT NULL, \`related_entity_type\` varchar(255) NULL, \`related_entity_id\` varchar(255) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`email_templates\` (\`templateKey\` varchar(100) NOT NULL, \`subject\` varchar(255) NOT NULL, \`bodyHtml\` text NOT NULL, \`description\` text NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`templateKey\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`backups\` (\`id\` varchar(255) NOT NULL, \`name\` varchar(255) NOT NULL, \`timestamp\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`size\` varchar(255) NOT NULL, \`type\` enum ('full', 'partial') NOT NULL DEFAULT 'full', \`status\` enum ('completed', 'in_progress', 'failed') NOT NULL DEFAULT 'in_progress', \`notes\` varchar(255) NULL, \`error_message\` varchar(255) NULL, \`file_path\` varchar(255) NULL, \`is_deleted\` tinyint NOT NULL DEFAULT 0, \`created_by_id\` varchar(36) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`activity_log\` (\`id\` varchar(36) NOT NULL, \`user_id\` varchar(255) NULL, \`action\` varchar(255) NOT NULL, \`target\` varchar(255) NOT NULL, \`target_id\` varchar(255) NULL, \`details\` varchar(255) NOT NULL, \`ip_address\` varchar(255) NULL, \`status\` enum ('success', 'warning', 'error') NOT NULL DEFAULT 'success', \`timestamp\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`role_workflow_step_permissions\` (\`roleId\` varchar(255) NOT NULL, \`workflowStepId\` varchar(255) NOT NULL, \`hasPermission\` tinyint NOT NULL DEFAULT 0, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_19789027c20796bcd8f34f2212\` (\`roleId\`, \`workflowStepId\`), PRIMARY KEY (\`roleId\`, \`workflowStepId\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`workflow_steps\` (\`id\` varchar(36) NOT NULL, \`workflowId\` varchar(255) NOT NULL, \`name\` varchar(255) NOT NULL, \`description\` text NULL, \`stepOrder\` int NOT NULL, \`permissionIdentifier\` varchar(255) NOT NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_26ada038b4feb5c5198fc00f8e\` (\`permissionIdentifier\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`workflows\` (\`id\` varchar(36) NOT NULL, \`name\` varchar(255) NOT NULL, \`slug\` varchar(255) NOT NULL, \`description\` text NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_a911fb2e0cb9ea97b6c39e0708\` (\`name\`), UNIQUE INDEX \`IDX_815ce003cc932d4919e5033645\` (\`slug\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`department_members\` (\`department_id\` varchar(36) NOT NULL, \`user_id\` varchar(36) NOT NULL, INDEX \`IDX_7d7af06fba109a8730e533c3e8\` (\`department_id\`), INDEX \`IDX_204f19d27111f77b67167bfa56\` (\`user_id\`), PRIMARY KEY (\`department_id\`, \`user_id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`task_user_assignees\` (\`task_id\` varchar(36) NOT NULL, \`user_id\` varchar(36) NOT NULL, INDEX \`IDX_1fcc07cf7a8aeca3ff133259ff\` (\`task_id\`), INDEX \`IDX_84efb7c2c1f00ffa656bccb6b8\` (\`user_id\`), PRIMARY KEY (\`task_id\`, \`user_id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`task_department_assignees\` (\`task_id\` varchar(36) NOT NULL, \`department_id\` varchar(36) NOT NULL, INDEX \`IDX_730107914e62685db17eceb53c\` (\`task_id\`), INDEX \`IDX_4ea92597931990089d7f1a9110\` (\`department_id\`), PRIMARY KEY (\`task_id\`, \`department_id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`role_permissions\` (\`role_id\` varchar(36) NOT NULL, \`permission_id\` varchar(36) NOT NULL, INDEX \`IDX_178199805b901ccd220ab7740e\` (\`role_id\`), INDEX \`IDX_17022daf3f885f7d35423e9971\` (\`permission_id\`), PRIMARY KEY (\`role_id\`, \`permission_id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`department\` ADD CONSTRAINT \`FK_7ae0dfd2411b5e2efc39cfafb48\` FOREIGN KEY (\`head_id\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`department\` ADD CONSTRAINT \`FK_88efd63ca0d064ae4d5dda8d47b\` FOREIGN KEY (\`provinceId\`) REFERENCES \`province\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`task\` ADD CONSTRAINT \`FK_91d76dd2ae372b9b7dfb6bf3fd2\` FOREIGN KEY (\`createdById\`) REFERENCES \`user\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`task\` ADD CONSTRAINT \`FK_87d208e99a0edf827688bb2d123\` FOREIGN KEY (\`assignedToProvinceId\`) REFERENCES \`province\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`task\` ADD CONSTRAINT \`FK_86ec16208c1d4ac14af7368bd01\` FOREIGN KEY (\`delegatedByUserId\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`task\` ADD CONSTRAINT \`FK_45393b7c8d0d02c3a8505807690\` FOREIGN KEY (\`delegatedFromTaskId\`) REFERENCES \`task\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`task\` ADD CONSTRAINT \`FK_6ff400c96cabbb58fdda2e7a25e\` FOREIGN KEY (\`delegatedToTaskId\`) REFERENCES \`task\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`task\` ADD CONSTRAINT \`FK_26b96babe5a5ce54c7b2f10f158\` FOREIGN KEY (\`deletedById\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`task\` ADD CONSTRAINT \`FK_da1037791781d27fe7c4970bc74\` FOREIGN KEY (\`cancelledById\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`task\` ADD CONSTRAINT \`FK_1379fc3349bc11577cba89d0e40\` FOREIGN KEY (\`pendingDelegatedToUserId\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`notes\` ADD CONSTRAINT \`FK_7708dcb62ff332f0eaf9f0743a7\` FOREIGN KEY (\`user_id\`) REFERENCES \`user\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`user\` ADD CONSTRAINT \`FK_fb2e442d14add3cefbdf33c4561\` FOREIGN KEY (\`role_id\`) REFERENCES \`roles\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`notifications\` ADD CONSTRAINT \`FK_9a8a82462cab47c73d25f49261f\` FOREIGN KEY (\`user_id\`) REFERENCES \`user\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`backups\` ADD CONSTRAINT \`FK_dd12c30eaa21888695759b027a3\` FOREIGN KEY (\`created_by_id\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`activity_log\` ADD CONSTRAINT \`FK_81615294532ca4b6c70abd1b2e6\` FOREIGN KEY (\`user_id\`) REFERENCES \`user\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`role_workflow_step_permissions\` ADD CONSTRAINT \`FK_442ba07b88134efc2a6b8581e49\` FOREIGN KEY (\`roleId\`) REFERENCES \`roles\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`role_workflow_step_permissions\` ADD CONSTRAINT \`FK_e1ffc9245c8aefa1cba488b0bc3\` FOREIGN KEY (\`workflowStepId\`) REFERENCES \`workflow_steps\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`workflow_steps\` ADD CONSTRAINT \`FK_eb0c057661503827a7cd6d8ea41\` FOREIGN KEY (\`workflowId\`) REFERENCES \`workflows\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`department_members\` ADD CONSTRAINT \`FK_7d7af06fba109a8730e533c3e8d\` FOREIGN KEY (\`department_id\`) REFERENCES \`department\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE \`department_members\` ADD CONSTRAINT \`FK_204f19d27111f77b67167bfa566\` FOREIGN KEY (\`user_id\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`task_user_assignees\` ADD CONSTRAINT \`FK_1fcc07cf7a8aeca3ff133259ff2\` FOREIGN KEY (\`task_id\`) REFERENCES \`task\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE \`task_user_assignees\` ADD CONSTRAINT \`FK_84efb7c2c1f00ffa656bccb6b8c\` FOREIGN KEY (\`user_id\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`task_department_assignees\` ADD CONSTRAINT \`FK_730107914e62685db17eceb53c4\` FOREIGN KEY (\`task_id\`) REFERENCES \`task\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE \`task_department_assignees\` ADD CONSTRAINT \`FK_4ea92597931990089d7f1a91103\` FOREIGN KEY (\`department_id\`) REFERENCES \`department\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`role_permissions\` ADD CONSTRAINT \`FK_178199805b901ccd220ab7740ec\` FOREIGN KEY (\`role_id\`) REFERENCES \`roles\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE \`role_permissions\` ADD CONSTRAINT \`FK_17022daf3f885f7d35423e9971e\` FOREIGN KEY (\`permission_id\`) REFERENCES \`permissions\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`role_permissions\` DROP FOREIGN KEY \`FK_17022daf3f885f7d35423e9971e\``);
        await queryRunner.query(`ALTER TABLE \`role_permissions\` DROP FOREIGN KEY \`FK_178199805b901ccd220ab7740ec\``);
        await queryRunner.query(`ALTER TABLE \`task_department_assignees\` DROP FOREIGN KEY \`FK_4ea92597931990089d7f1a91103\``);
        await queryRunner.query(`ALTER TABLE \`task_department_assignees\` DROP FOREIGN KEY \`FK_730107914e62685db17eceb53c4\``);
        await queryRunner.query(`ALTER TABLE \`task_user_assignees\` DROP FOREIGN KEY \`FK_84efb7c2c1f00ffa656bccb6b8c\``);
        await queryRunner.query(`ALTER TABLE \`task_user_assignees\` DROP FOREIGN KEY \`FK_1fcc07cf7a8aeca3ff133259ff2\``);
        await queryRunner.query(`ALTER TABLE \`department_members\` DROP FOREIGN KEY \`FK_204f19d27111f77b67167bfa566\``);
        await queryRunner.query(`ALTER TABLE \`department_members\` DROP FOREIGN KEY \`FK_7d7af06fba109a8730e533c3e8d\``);
        await queryRunner.query(`ALTER TABLE \`workflow_steps\` DROP FOREIGN KEY \`FK_eb0c057661503827a7cd6d8ea41\``);
        await queryRunner.query(`ALTER TABLE \`role_workflow_step_permissions\` DROP FOREIGN KEY \`FK_e1ffc9245c8aefa1cba488b0bc3\``);
        await queryRunner.query(`ALTER TABLE \`role_workflow_step_permissions\` DROP FOREIGN KEY \`FK_442ba07b88134efc2a6b8581e49\``);
        await queryRunner.query(`ALTER TABLE \`activity_log\` DROP FOREIGN KEY \`FK_81615294532ca4b6c70abd1b2e6\``);
        await queryRunner.query(`ALTER TABLE \`backups\` DROP FOREIGN KEY \`FK_dd12c30eaa21888695759b027a3\``);
        await queryRunner.query(`ALTER TABLE \`notifications\` DROP FOREIGN KEY \`FK_9a8a82462cab47c73d25f49261f\``);
        await queryRunner.query(`ALTER TABLE \`user\` DROP FOREIGN KEY \`FK_fb2e442d14add3cefbdf33c4561\``);
        await queryRunner.query(`ALTER TABLE \`notes\` DROP FOREIGN KEY \`FK_7708dcb62ff332f0eaf9f0743a7\``);
        await queryRunner.query(`ALTER TABLE \`task\` DROP FOREIGN KEY \`FK_1379fc3349bc11577cba89d0e40\``);
        await queryRunner.query(`ALTER TABLE \`task\` DROP FOREIGN KEY \`FK_da1037791781d27fe7c4970bc74\``);
        await queryRunner.query(`ALTER TABLE \`task\` DROP FOREIGN KEY \`FK_26b96babe5a5ce54c7b2f10f158\``);
        await queryRunner.query(`ALTER TABLE \`task\` DROP FOREIGN KEY \`FK_6ff400c96cabbb58fdda2e7a25e\``);
        await queryRunner.query(`ALTER TABLE \`task\` DROP FOREIGN KEY \`FK_45393b7c8d0d02c3a8505807690\``);
        await queryRunner.query(`ALTER TABLE \`task\` DROP FOREIGN KEY \`FK_86ec16208c1d4ac14af7368bd01\``);
        await queryRunner.query(`ALTER TABLE \`task\` DROP FOREIGN KEY \`FK_87d208e99a0edf827688bb2d123\``);
        await queryRunner.query(`ALTER TABLE \`task\` DROP FOREIGN KEY \`FK_91d76dd2ae372b9b7dfb6bf3fd2\``);
        await queryRunner.query(`ALTER TABLE \`department\` DROP FOREIGN KEY \`FK_88efd63ca0d064ae4d5dda8d47b\``);
        await queryRunner.query(`ALTER TABLE \`department\` DROP FOREIGN KEY \`FK_7ae0dfd2411b5e2efc39cfafb48\``);
        await queryRunner.query(`DROP INDEX \`IDX_17022daf3f885f7d35423e9971\` ON \`role_permissions\``);
        await queryRunner.query(`DROP INDEX \`IDX_178199805b901ccd220ab7740e\` ON \`role_permissions\``);
        await queryRunner.query(`DROP TABLE \`role_permissions\``);
        await queryRunner.query(`DROP INDEX \`IDX_4ea92597931990089d7f1a9110\` ON \`task_department_assignees\``);
        await queryRunner.query(`DROP INDEX \`IDX_730107914e62685db17eceb53c\` ON \`task_department_assignees\``);
        await queryRunner.query(`DROP TABLE \`task_department_assignees\``);
        await queryRunner.query(`DROP INDEX \`IDX_84efb7c2c1f00ffa656bccb6b8\` ON \`task_user_assignees\``);
        await queryRunner.query(`DROP INDEX \`IDX_1fcc07cf7a8aeca3ff133259ff\` ON \`task_user_assignees\``);
        await queryRunner.query(`DROP TABLE \`task_user_assignees\``);
        await queryRunner.query(`DROP INDEX \`IDX_204f19d27111f77b67167bfa56\` ON \`department_members\``);
        await queryRunner.query(`DROP INDEX \`IDX_7d7af06fba109a8730e533c3e8\` ON \`department_members\``);
        await queryRunner.query(`DROP TABLE \`department_members\``);
        await queryRunner.query(`DROP INDEX \`IDX_815ce003cc932d4919e5033645\` ON \`workflows\``);
        await queryRunner.query(`DROP INDEX \`IDX_a911fb2e0cb9ea97b6c39e0708\` ON \`workflows\``);
        await queryRunner.query(`DROP TABLE \`workflows\``);
        await queryRunner.query(`DROP INDEX \`IDX_26ada038b4feb5c5198fc00f8e\` ON \`workflow_steps\``);
        await queryRunner.query(`DROP TABLE \`workflow_steps\``);
        await queryRunner.query(`DROP INDEX \`IDX_19789027c20796bcd8f34f2212\` ON \`role_workflow_step_permissions\``);
        await queryRunner.query(`DROP TABLE \`role_workflow_step_permissions\``);
        await queryRunner.query(`DROP TABLE \`activity_log\``);
        await queryRunner.query(`DROP TABLE \`backups\``);
        await queryRunner.query(`DROP TABLE \`email_templates\``);
        await queryRunner.query(`DROP TABLE \`notifications\``);
        await queryRunner.query(`DROP TABLE \`security_settings\``);
        await queryRunner.query(`DROP TABLE \`settings\``);
        await queryRunner.query(`DROP TABLE \`backup_settings\``);
        await queryRunner.query(`DROP TABLE \`notification_settings\``);
        await queryRunner.query(`DROP INDEX \`IDX_e12875dfb3b1d92d7d7c5377e2\` ON \`user\``);
        await queryRunner.query(`DROP INDEX \`IDX_78a916df40e02a9deb1c4b75ed\` ON \`user\``);
        await queryRunner.query(`DROP TABLE \`user\``);
        await queryRunner.query(`DROP INDEX \`IDX_648e3f5447f725579d7d4ffdfb\` ON \`roles\``);
        await queryRunner.query(`DROP TABLE \`roles\``);
        await queryRunner.query(`DROP INDEX \`IDX_48ce552495d14eae9b187bb671\` ON \`permissions\``);
        await queryRunner.query(`DROP TABLE \`permissions\``);
    }

}
