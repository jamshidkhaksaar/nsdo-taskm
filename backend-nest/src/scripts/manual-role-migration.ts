import { NestFactory } from "@nestjs/core";
import { AppModule } from "../app.module";
import { getConnection } from "typeorm";

/**
 * Migration script to manually convert user roles without using TypeORM migrations
 * This script directly executes the necessary SQL queries to update the role enum
 */
async function manualRoleMigration() {
  // Initialize NestJS app to have access to services and repositories
  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    console.log("Starting manual role migration...");

    // Get connection
    const connection = getConnection();

    // Step 1: Update existing roles to new mapping
    console.log("Step 1: Mapping roles...");

    // Update MANAGER -> USER
    const managerResult = await connection.query(
      `UPDATE \`user\` SET \`role\` = 'user' WHERE \`role\` = 'manager'`,
    );
    console.log(
      `Updated manager roles: ${managerResult.affectedRows || 0} rows affected`,
    );

    // Update GENERAL_MANAGER -> LEADERSHIP
    const gmResult = await connection.query(
      `UPDATE \`user\` SET \`role\` = 'leadership' WHERE \`role\` = 'general_manager'`,
    );
    console.log(
      `Updated general_manager roles: ${gmResult.affectedRows || 0} rows affected`,
    );

    // Step 2: Modify the ENUM type
    console.log("Step 2: Modifying the role enum...");

    // First, convert to string type to avoid constraint issues
    await connection.query(
      `ALTER TABLE \`user\` MODIFY COLUMN \`role\` VARCHAR(255) NOT NULL`,
    );
    console.log("Changed role column to VARCHAR temporarily");

    // Now set the new ENUM values
    await connection.query(`ALTER TABLE \`user\` MODIFY COLUMN \`role\` 
      ENUM('user', 'leadership', 'admin') NOT NULL DEFAULT 'user'`);
    console.log("Updated role column to new ENUM values");

    console.log("Manual role migration completed successfully");
  } catch (error) {
    console.error("Error during manual role migration:", error);
  } finally {
    await app.close();
  }
}

// Call the migration function
manualRoleMigration()
  .then(() => console.log("Manual migration script execution completed"))
  .catch((error) => console.error("Manual migration script failed:", error));
