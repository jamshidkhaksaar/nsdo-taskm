import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";

// Path to the .env file
const envPath = path.resolve(process.cwd(), ".env");

// Check if .env file exists
if (!fs.existsSync(envPath)) {
  console.error("ERROR: .env file not found!");
  console.error(`Looked for .env file at: ${envPath}`);
  console.error(
    "Create a .env file with database credentials before running migrations.",
  );
  console.error("Example .env file:");
  console.error(`
DATABASE_HOST=localhost
DATABASE_PORT=3306
DATABASE_USERNAME=your_username
DATABASE_PASSWORD=your_password
DATABASE_NAME=taskmanagement
  `);
  process.exit(1);
}

// Load environment variables
dotenv.config();

// Required environment variables for database connection
const requiredVars = [
  "DATABASE_HOST",
  "DATABASE_PORT",
  "DATABASE_USERNAME",
  "DATABASE_PASSWORD",
  "DATABASE_NAME",
];

// Check if all required variables are defined
const missingVars = requiredVars.filter((variable) => !process.env[variable]);

if (missingVars.length > 0) {
  console.error("ERROR: Missing required environment variables:");
  missingVars.forEach((variable) => console.error(`- ${variable}`));
  console.error("Update your .env file with the missing variables.");
  process.exit(1);
} else {
  console.log(
    "Environment check: All required database variables are present.",
  );
  console.log("Database connection details:");
  console.log(`Host: ${process.env.DATABASE_HOST}`);
  console.log(`Port: ${process.env.DATABASE_PORT}`);
  console.log(`Database: ${process.env.DATABASE_NAME}`);
  console.log(`Username: ${process.env.DATABASE_USERNAME}`);
  console.log(
    `Password: ${process.env.DATABASE_PASSWORD ? "******** (set)" : "(not set)"}`,
  );
  console.log("Environment variables are correctly configured.");
}
