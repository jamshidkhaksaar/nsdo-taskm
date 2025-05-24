import { createConnection } from "typeorm";
// import { User } from "../users/entities/user.entity";
// import { Role } from "../rbac/entities/role.entity";
// import { Permission } from "../rbac/entities/permission.entity";
// import { Task } from "../tasks/entities/task.entity";
// import { Department } from "../departments/entities/department.entity";
// import { Note } from "../notes/entities/note.entity";
// import { Province } from "../provinces/entities/province.entity";
import { Logger } from "@nestjs/common";
import * as dotenv from "dotenv";
import * as path from "path";
import * as fs from "fs";

// Try to load environment variables from .env file
const envPath = path.resolve(process.cwd(), ".env");
try {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    console.log(`Loaded environment from: ${envPath}`);
  } else {
    console.log(`No .env file found at: ${envPath}, using hardcoded values`);
  }
} catch (error) {
  console.error(`Error loading .env file: ${error.message}`);
}

// Hardcoded database config for testing
const dbConfig = {
  host: "localhost",
  port: 3306,
  username: "root",
  password: "root",
  database: "taskmanagement",
};

console.log("Using hardcoded database config:", {
  host: dbConfig.host,
  port: dbConfig.port,
  username: dbConfig.username,
  // Don't log password for security
  database: dbConfig.database,
});

/**
 * This script migrates users from the old role system (using hard-coded role values)
 * to the new RBAC system (using Role entities).
 *
 * It uses direct SQL queries to avoid TypeORM entity relation issues.
 */
async function migrateToRbac() {
  const logger = new Logger("MigrateToRbac");
  logger.log("Starting migration to RBAC system...");

  // Create a simpler TypeORM connection without all the relations
  const connection = await createConnection({
    type: "mysql",
    host: dbConfig.host,
    port: dbConfig.port,
    username: dbConfig.username,
    password: dbConfig.password,
    database: dbConfig.database,
    synchronize: false,
  });

  logger.log("Connection established");

  try {
    // Check if the roles table exists
    try {
      console.log("Checking if roles table exists...");
      const roleTableExists = await connection.query(
        `
        SELECT COUNT(*) as count 
        FROM information_schema.tables 
        WHERE table_schema = ? AND table_name = 'roles'
      `,
        [dbConfig.database],
      );

      console.log("Role table exists check result:", roleTableExists);

      if (parseInt(roleTableExists[0].count) === 0) {
        logger.error(
          "The roles table does not exist. The RBAC module needs to be set up first.",
        );
        logger.error("Steps to set up the RBAC module:");
        logger.error(
          "1. Make sure DATABASE_SYNC=true is set in your .env file",
        );
        logger.error("2. Start the application with npm run start:dev");
        logger.error(
          "3. Verify in your database that the roles and permissions tables are created",
        );
        logger.error("4. Run this migration script again");
        return;
      }
    } catch (error) {
      logger.error(`Error checking if roles table exists: ${error.message}`);
      return;
    }

    // Get all roles
    const roles = await connection.query("SELECT id, name FROM roles");
    logger.log(`Found ${roles.length} roles`);

    if (roles.length === 0) {
      logger.error(
        "No roles found in the database. Make sure RbacSeederService has run.",
      );
      return;
    }

    // Create a map for quick lookups
    const roleMap = new Map<string, any>();
    roles.forEach((role) => roleMap.set(role.name.toLowerCase(), role));

    // Make sure we have the required roles
    const requiredRoles = ["admin", "leadership", "user", "Standard User"];

    for (const roleName of requiredRoles) {
      if (!roleMap.has(roleName.toLowerCase())) {
        logger.warn(
          `Required role "${roleName}" not found in the database. Make sure RbacSeederService has run.`,
        );
      }
    }

    // Find all users
    const users = await connection.query("SELECT id, username, role FROM user");
    logger.log(`Found ${users.length} users to migrate`);

    let updatedCount = 0;
    let skippedCount = 0;

    // Now, update each user with a proper role entity reference
    for (const user of users) {
      try {
        // Get current role value with proper type handling
        let currentRoleValue = "user"; // Default

        if (user.role) {
          currentRoleValue = String(user.role).toLowerCase();
        }

        // For the new system, map to role entity
        // Map 'user' to 'Standard User' if that's the name in the RBAC system
        const targetRoleName =
          currentRoleValue === "user" && roleMap.has("standard user")
            ? "standard user"
            : currentRoleValue;

        const roleEntity = roleMap.get(targetRoleName);

        if (!roleEntity) {
          logger.warn(
            `Role "${targetRoleName}" not found for user ${user.username} (${user.id}). Skipping.`,
          );
          skippedCount++;
          continue;
        }

        // Update user's role reference using direct SQL
        await connection.query("UPDATE user SET role_id = ? WHERE id = ?", [
          roleEntity.id,
          user.id,
        ]);

        updatedCount++;

        logger.log(
          `Updated user ${user.username} (${user.id}) from "${currentRoleValue}" to role entity "${roleEntity.name}"`,
        );
      } catch (err) {
        logger.error(`Error updating user ${user.id}: ${err.message}`);
        skippedCount++;
      }
    }

    logger.log(
      `Migration completed. ${updatedCount} users updated, ${skippedCount} users skipped.`,
    );
  } catch (err) {
    logger.error(`Migration failed: ${err.message}`);
    throw err;
  } finally {
    // Close the connection
    await connection.close();
    logger.log("Connection closed");
  }
}

// Run the migration if this script is executed directly
if (require.main === module) {
  migrateToRbac()
    .then(() => {
      console.log("Migration completed successfully");
      process.exit(0);
    })
    .catch((err) => {
      console.error("Migration failed:", err);
      process.exit(1);
    });
}

export { migrateToRbac };
