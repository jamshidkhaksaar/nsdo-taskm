import { createConnection } from "typeorm";
import { Logger } from "@nestjs/common";

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
  database: dbConfig.database,
});

/**
 * This script sets up the RBAC tables and seeds initial data
 */
async function setupRbacTables() {
  // const logger = new Logger("SetupRbacTables");
  console.log("Starting RBAC tables setup...");

  // Create a simple TypeORM connection
  console.log("Connecting to database...");
  const connection = await createConnection({
    type: "mysql",
    host: dbConfig.host,
    port: dbConfig.port,
    username: dbConfig.username,
    password: dbConfig.password,
    database: dbConfig.database,
    synchronize: false,
  });

  console.log("Connection established");

  try {
    // Create the permissions table
    console.log("Creating permissions table...");
    await connection.query(`
      CREATE TABLE IF NOT EXISTS permissions (
        id varchar(36) NOT NULL,
        name varchar(100) NOT NULL,
        description text,
        \`group\` varchar(50) DEFAULT NULL,
        created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY IDX_permissions_name (name)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    console.log("Permissions table created or already exists");

    // Create the roles table
    console.log("Creating roles table...");
    await connection.query(`
      CREATE TABLE IF NOT EXISTS roles (
        id varchar(36) NOT NULL,
        name varchar(50) NOT NULL,
        description text,
        is_system_role tinyint(1) NOT NULL DEFAULT '0',
        created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY IDX_roles_name (name)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    console.log("Roles table created or already exists");

    // Create the role_permissions join table
    console.log("Creating role_permissions table...");
    await connection.query(`
      CREATE TABLE IF NOT EXISTS role_permissions (
        role_id varchar(36) NOT NULL,
        permission_id varchar(36) NOT NULL,
        PRIMARY KEY (role_id,permission_id),
        KEY FK_role_permissions_permission_id (permission_id),
        CONSTRAINT FK_role_permissions_permission_id FOREIGN KEY (permission_id) REFERENCES permissions (id) ON DELETE CASCADE,
        CONSTRAINT FK_role_permissions_role_id FOREIGN KEY (role_id) REFERENCES roles (id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    console.log("Role_permissions table created or already exists");

    // Add role_id column to user table if it doesn't exist
    console.log("Adding role_id column to user table...");
    try {
      await connection.query(`
        ALTER TABLE user 
        ADD COLUMN IF NOT EXISTS role_id varchar(36) NULL,
        ADD CONSTRAINT FK_user_role_id FOREIGN KEY (role_id) REFERENCES roles (id) ON DELETE SET NULL;
      `);
      console.log("Role_id column added to user table or already exists");
    } catch (error) {
      console.warn(
        `Could not add role_id column. It may already exist or there's an issue: ${error.message}`,
      );
    }

    // Check if tables were created
    console.log("Checking if RBAC tables were created...");
    const tables = await connection.query(
      `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = ? 
      AND table_name IN ('roles', 'permissions', 'role_permissions')
    `,
      [dbConfig.database],
    );

    console.log(
      "Found RBAC tables:",
      tables.map((t) => t.table_name),
    );

    console.log(
      "RBAC tables created successfully. Now run the application to seed data.",
    );
  } catch (err) {
    console.error(`Setup failed: ${err.message}`);
    console.error(err.stack);
    throw err;
  } finally {
    // Close the connection
    await connection.close();
    console.log("Connection closed");
  }
}

// Run the script if it is executed directly
if (require.main === module) {
  setupRbacTables()
    .then(() => {
      console.log("RBAC tables setup completed successfully");
      process.exit(0);
    })
    .catch((err) => {
      console.error("RBAC tables setup failed:", err);
      process.exit(1);
    });
}

export { setupRbacTables };
