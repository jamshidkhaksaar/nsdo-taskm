/**
 * Script to create an admin user directly in the database
 * 
 * Run with: node create-admin-user.js
 */

const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

async function createAdminUser() {
  try {
    console.log('Reading database configuration...');
    
    // Read database configuration from .env file
    const envConfig = fs.readFileSync(path.join(__dirname, 'backend-nest', '.env'), 'utf8')
      .split('\n')
      .filter(line => line.trim() !== '' && !line.startsWith('#'))
      .reduce((config, line) => {
        const [key, value] = line.split('=');
        config[key.trim()] = value.trim();
        return config;
      }, {});
    
    // Connect to MySQL
    console.log('Connecting to MySQL database...');
    const connection = await mysql.createConnection({
      host: envConfig.DATABASE_HOST,
      port: parseInt(envConfig.DATABASE_PORT),
      user: envConfig.DATABASE_USERNAME,
      password: envConfig.DATABASE_PASSWORD,
      database: envConfig.DATABASE_NAME,
    });
    
    console.log('Connected to database successfully');
    
    // Check if user table exists
    console.log('Checking for user table...');
    const [tables] = await connection.execute('SHOW TABLES LIKE "user"');
    
    if (tables.length === 0) {
      console.log('User table not found, creating it...');
      await connection.execute(`
        CREATE TABLE user (
          id VARCHAR(36) PRIMARY KEY,
          username VARCHAR(255) NOT NULL UNIQUE,
          email VARCHAR(255) NOT NULL UNIQUE,
          password VARCHAR(255) NOT NULL,
          role ENUM('user', 'general_manager', 'admin') DEFAULT 'user',
          isActive BOOLEAN DEFAULT TRUE,
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);
      console.log('User table created successfully');
    } else {
      console.log('User table already exists');
    }
    
    // Create admin user
    console.log('Creating admin user...');
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);
    
    // Generate UUID
    const userId = uuidv4();
    
    // Check if admin user already exists
    const [existingUsers] = await connection.execute('SELECT * FROM user WHERE username = ?', ['admin']);
    
    if (existingUsers.length > 0) {
      console.log('Admin user already exists, updating password...');
      await connection.execute(
        'UPDATE user SET password = ? WHERE username = ?',
        [hashedPassword, 'admin']
      );
      console.log('Admin user password updated successfully');
    } else {
      // Insert admin user
      await connection.execute(
        'INSERT INTO user (id, username, email, password, role, isActive, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())',
        [userId, 'admin', 'admin@example.com', hashedPassword, 'admin', true]
      );
      console.log('Admin user created successfully');
    }
    
    // Create regular user
    console.log('Creating regular user...');
    
    // Hash password
    const userPassword = await bcrypt.hash('user123', salt);
    
    // Generate UUID
    const regularUserId = uuidv4();
    
    // Check if regular user already exists
    const [existingRegularUsers] = await connection.execute('SELECT * FROM user WHERE username = ?', ['user1']);
    
    if (existingRegularUsers.length > 0) {
      console.log('Regular user already exists, updating password...');
      await connection.execute(
        'UPDATE user SET password = ? WHERE username = ?',
        [userPassword, 'user1']
      );
      console.log('Regular user password updated successfully');
    } else {
      // Insert regular user
      await connection.execute(
        'INSERT INTO user (id, username, email, password, role, isActive, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())',
        [regularUserId, 'user1', 'user1@example.com', userPassword, 'user', true]
      );
      console.log('Regular user created successfully');
    }
    
    // Show users in the table
    console.log('Users in the database:');
    const [users] = await connection.execute('SELECT id, username, email, role FROM user');
    console.table(users);
    
    console.log('Script completed successfully!');
    await connection.end();
    
  } catch (error) {
    console.error('Error creating admin user:', error);
  }
}

createAdminUser(); 