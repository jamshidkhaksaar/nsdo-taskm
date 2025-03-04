/**
 * Script to import test data into the local database
 * 
 * Run with: node import-test-data.js
 */

const { createConnection } = require('typeorm');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

// Sample test data
const testUsers = [
  {
    id: uuidv4(), // Using UUID instead of numeric ID
    username: 'admin',
    password: 'admin123', // Will be hashed
    email: 'admin@example.com',
    role: 'admin', // Match the enum in the entity
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: uuidv4(),
    username: 'user1',
    password: 'user123', // Will be hashed
    email: 'user1@example.com',
    role: 'user',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: uuidv4(),
    username: 'user2',
    password: 'user123', // Will be hashed
    email: 'user2@example.com',
    role: 'user',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

const testTasks = [
  {
    id: 1,
    title: 'Complete project setup',
    description: 'Set up the project structure and dependencies',
    status: 'DONE',
    priority: 'HIGH',
    dueDate: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 2,
    title: 'Implement authentication',
    description: 'Add JWT authentication to the API',
    status: 'IN_PROGRESS',
    priority: 'HIGH',
    dueDate: new Date(new Date().getTime() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 3,
    title: 'Design database schema',
    description: 'Create database schema for the application',
    status: 'TODO',
    priority: 'MEDIUM',
    dueDate: new Date(new Date().getTime() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 4,
    title: 'Fix UI bugs',
    description: 'Fix UI issues in the dashboard',
    status: 'TODO',
    priority: 'LOW',
    dueDate: new Date(new Date().getTime() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

async function importData() {
  try {
    console.log('Connecting to database...');
    
    // Read database configuration from .env file
    const envConfig = fs.readFileSync(path.join(__dirname, 'backend-nest', '.env'), 'utf8')
      .split('\n')
      .filter(line => line.trim() !== '' && !line.startsWith('#'))
      .reduce((config, line) => {
        const [key, value] = line.split('=');
        config[key.trim()] = value.trim();
        return config;
      }, {});
    
    const connection = await createConnection({
      type: envConfig.DATABASE_TYPE,
      host: envConfig.DATABASE_HOST,
      port: parseInt(envConfig.DATABASE_PORT),
      username: envConfig.DATABASE_USERNAME,
      password: envConfig.DATABASE_PASSWORD,
      database: envConfig.DATABASE_NAME,
      synchronize: true, // Ensure tables are created
      entities: [
        path.join(__dirname, 'backend-nest', 'dist', '**', '*.entity.js')
      ]
    });
    
    console.log('Connected to database successfully');
    
    // Import users
    console.log('Importing users...');
    const queryRunner = connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    
    try {
      // Check if tables exist
      const tables = await queryRunner.query(`SHOW TABLES`);
      console.log('Existing tables:', tables);
      
      // Clear existing data - be careful with the order due to foreign key constraints
      try {
        await queryRunner.query('SET FOREIGN_KEY_CHECKS = 0');
        
        // Check if task table exists
        const taskTableExists = tables.some(t => Object.values(t)[0] === 'task');
        if (taskTableExists) {
          await queryRunner.query('TRUNCATE TABLE task');
          console.log('Truncated task table');
        }
        
        // Check if user table exists
        const userTableExists = tables.some(t => Object.values(t)[0] === 'user');
        if (userTableExists) {
          await queryRunner.query('TRUNCATE TABLE user');
          console.log('Truncated user table');
        }
        
        await queryRunner.query('SET FOREIGN_KEY_CHECKS = 1');
      } catch (error) {
        console.error('Error clearing tables:', error);
      }
      
      // Import users with hashed passwords
      for (const user of testUsers) {
        const hashedPassword = await bcrypt.hash(user.password, 10);
        
        try {
          await queryRunner.query(`
            INSERT INTO user (id, username, password, email, role, isActive, createdAt, updatedAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `, [user.id, user.username, hashedPassword, user.email, user.role, user.isActive, user.createdAt, user.updatedAt]);
          
          console.log(`Created user: ${user.username}`);
        } catch (error) {
          console.error(`Error creating user ${user.username}:`, error);
          // Try to get the user table structure
          try {
            const userTableStructure = await queryRunner.query('DESCRIBE user');
            console.log('User table structure:', userTableStructure);
          } catch (e) {
            console.error('Could not get user table structure:', e);
          }
        }
      }
      
      // Get the admin user ID for task creation
      const adminUser = testUsers.find(u => u.username === 'admin');
      
      // Import tasks
      console.log('Importing tasks...');
      for (const task of testTasks) {
        try {
          await queryRunner.query(`
            INSERT INTO task (id, title, description, status, priority, dueDate, createdAt, updatedAt, createdById)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [task.id, task.title, task.description, task.status, task.priority, task.dueDate, 
              task.createdAt, task.updatedAt, adminUser.id]);
          
          console.log(`Created task: ${task.title}`);
        } catch (error) {
          console.error(`Error creating task ${task.title}:`, error);
          // Try to get the task table structure
          try {
            const taskTableStructure = await queryRunner.query('DESCRIBE task');
            console.log('Task table structure:', taskTableStructure);
          } catch (e) {
            console.error('Could not get task table structure:', e);
          }
        }
      }
      
      await queryRunner.commitTransaction();
      console.log('Data imported successfully!');
    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.error('Error importing data:', error);
    } finally {
      await queryRunner.release();
      await connection.close();
    }
    
  } catch (error) {
    console.error('Failed to connect to database:', error);
  }
}

importData(); 