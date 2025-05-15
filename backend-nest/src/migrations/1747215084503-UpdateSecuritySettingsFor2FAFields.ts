import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateSecuritySettingsFor2FAFields1747215084503 implements MigrationInterface {
    name = 'UpdateSecuritySettingsFor2FAFields1747215084503'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`security_settings\` ADD \`two_factor_device_remembrance_days\` int NOT NULL DEFAULT '30'`);
        await queryRunner.query(`ALTER TABLE \`security_settings\` ADD \`two_factor_max_failed_attempts\` int NOT NULL DEFAULT '5'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`security_settings\` DROP COLUMN \`two_factor_max_failed_attempts\``);
        await queryRunner.query(`ALTER TABLE \`security_settings\` DROP COLUMN \`two_factor_device_remembrance_days\``);
    }

}
