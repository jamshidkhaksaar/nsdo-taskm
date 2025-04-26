import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateSettingsTable1745662956505 implements MigrationInterface {
    name = 'CreateSettingsTable1745662956505'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`settings\` (\`key\` varchar(50) NOT NULL, \`value\` text NOT NULL, \`description\` text NULL, \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`key\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`email_templates\` (\`templateKey\` varchar(100) NOT NULL, \`subject\` varchar(255) NOT NULL, \`bodyHtml\` text NOT NULL, \`description\` text NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`templateKey\`)) ENGINE=InnoDB`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE \`email_templates\``);
        await queryRunner.query(`DROP TABLE \`settings\``);
    }

}
