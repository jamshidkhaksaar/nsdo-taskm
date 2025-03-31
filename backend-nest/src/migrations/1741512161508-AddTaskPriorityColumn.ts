import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTaskPriorityColumn1741512161508 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add priority column
        await queryRunner.query(`
            ALTER TABLE task 
            ADD COLUMN IF NOT EXISTS priority ENUM('low', 'medium', 'high') NOT NULL DEFAULT 'medium'
        `);

        // Update existing records
        await queryRunner.query(`
            UPDATE task SET priority = 'medium' WHERE priority IS NULL
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE task 
            DROP COLUMN priority
        `);
    }
}