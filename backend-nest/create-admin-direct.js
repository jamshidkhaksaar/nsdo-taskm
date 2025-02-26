/**
 * This script creates an admin user directly in the database using TypeORM.
 * It's useful if you're having issues with the NestJS CLI commands.
 */

const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const readline = require('readline');
const dotenv = require('dotenv');
const { v4: uuidv4 } = require('uuid');

// Load environment variables
dotenv.config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function createAdminUser() {
  // Prompt for admin user details
  const username = await question('Enter admin username: ');
  const email = await question('Enter admin email: ');
  const password = await question('Enter admin password: ');

  // Hash the password
  const salt = await bcrypt.genSalt();
  const hashedPassword = await bcrypt.hash(password, salt);

  // Generate a UUID for the user
  const userId = uuidv4();

  // Create MySQL connection
  const connection = await mysql.createConnection({
    host: process.env.DATABASE_HOST || 'localhost',
    port: process.env.DATABASE_PORT || 3306,
    user: process.env.DATABASE_USERNAME || 'root',
    password: process.env.DATABASE_PASSWORD || 'root',
    database: process.env.DATABASE_NAME || 'taskmanagement'
  });

  try {
    // Check if user already exists
    const [existingUsers] = await connection.execute(
      'SELECT * FROM user WHERE username = ? OR email = ?',
      [username, email]
    );

    if (existingUsers.length > 0) {
      console.error('User with this username or email already exists');
      return;
    }

    // Insert the admin user
    const [result] = await connection.execute(
      'INSERT INTO user (id, username, email, password, role, isActive, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())',
      [userId, username, email, hashedPassword, 'admin', 1]
    );

    console.log(`Admin user created successfully with ID: ${userId}`);
  } catch (error) {
    console.error('Error creating admin user:', error.message);
  } finally {
    await connection.end();
    rl.close();
  }
}

function question(query) {
  return new Promise(resolve => {
    rl.question(query, resolve);
  });
}

createAdminUser(); 