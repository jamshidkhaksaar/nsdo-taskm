import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUser2FALockoutFields1747215280813 implements MigrationInterface {
    name = 'AddUser2FALockoutFields1747215280813'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`user\` ADD \`failed_two_factor_attempts\` int NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE \`user\` ADD \`two_factor_lockout_until\` timestamp NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`user\` DROP COLUMN \`two_factor_lockout_until\``);
        await queryRunner.query(`ALTER TABLE \`user\` DROP COLUMN \`failed_two_factor_attempts\``);
    }

}
