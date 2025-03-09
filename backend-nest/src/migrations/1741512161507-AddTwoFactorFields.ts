import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTwoFactorFields1741512161507 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add twoFactorEnabled column
        await queryRunner.query(`
            ALTER TABLE \`user\` 
            ADD COLUMN \`twoFactorEnabled\` boolean NOT NULL DEFAULT false
        `);

        // Add twoFactorSecret column
        await queryRunner.query(`
            ALTER TABLE \`user\` 
            ADD COLUMN \`twoFactorSecret\` varchar(255) NULL
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove twoFactorSecret column
        await queryRunner.query(`
            ALTER TABLE \`user\` 
            DROP COLUMN \`twoFactorSecret\`
        `);

        // Remove twoFactorEnabled column
        await queryRunner.query(`
            ALTER TABLE \`user\` 
            DROP COLUMN \`twoFactorEnabled\`
        `);
    }

}
