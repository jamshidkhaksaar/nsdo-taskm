import { MigrationInterface, QueryRunner } from 'typeorm';

export class SimplifyUserRoles1700000000000 implements MigrationInterface {
  name = 'SimplifyUserRoles1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Step 1: Update existing roles to new mapping
    // MANAGER -> USER
    await queryRunner.query(`UPDATE \`user\` SET \`role\` = 'user' WHERE \`role\` = 'manager'`);
    
    // GENERAL_MANAGER -> LEADERSHIP
    await queryRunner.query(`UPDATE \`user\` SET \`role\` = 'leadership' WHERE \`role\` = 'general_manager'`);
    
    // Step 2: Modify the ENUM type
    // First, drop check constraint/alter column
    await queryRunner.query(`ALTER TABLE \`user\` MODIFY COLUMN \`role\` VARCHAR(255) NOT NULL`);
    
    // Set the new ENUM values
    await queryRunner.query(`ALTER TABLE \`user\` MODIFY COLUMN \`role\` 
      ENUM('user', 'leadership', 'admin') NOT NULL DEFAULT 'user'`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // First, convert to string type to avoid constraint issues
    await queryRunner.query(`ALTER TABLE \`user\` MODIFY COLUMN \`role\` VARCHAR(255) NOT NULL`);
    
    // Then add back the original enum values
    await queryRunner.query(`ALTER TABLE \`user\` MODIFY COLUMN \`role\` 
      ENUM('user', 'manager', 'general_manager', 'admin', 'leadership') NOT NULL DEFAULT 'user'`);
    
    // Note: We can't restore the exact original data mapping since the migration is lossy
    // But we can restore the schema structure
  }
} 