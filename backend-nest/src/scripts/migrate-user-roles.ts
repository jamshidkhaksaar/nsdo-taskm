import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { ConfigService } from '@nestjs/config';
import * as dotenv from 'dotenv';
import * as mysql from 'mysql2/promise';

// Load environment variables from .env file
dotenv.config();

/**
 * Migration script to convert existing user roles to the new simplified structure:
 * - 'manager' -> 'user'
 * - 'general_manager' -> 'leadership'
 * 
 * This script can be run after the database schema migration
 * to ensure all data is properly migrated.
 */
async function migrateUserRoles() {
  // Initialize NestJS app to have access to services and repositories
  const app = await NestFactory.createApplicationContext(AppModule);
  const configService = app.get(ConfigService);
  
  // Get database credentials from environment
  const dbHost = configService.get('DATABASE_HOST', 'localhost');
  const dbPort = parseInt(configService.get('DATABASE_PORT', '3306'));
  const dbUsername = configService.get('DATABASE_USERNAME', 'root');
  const dbPassword = configService.get('DATABASE_PASSWORD', '');
  const dbDatabase = configService.get('DATABASE_NAME', 'taskmanagement');
  
  console.log(`Connecting to database: ${dbHost}:${dbPort}/${dbDatabase} as ${dbUsername}`);
  console.log(`Password provided: ${dbPassword ? 'Yes' : 'No'}`);
  
  let connection;
  
  try {
    // Create MySQL connection directly instead of using TypeORM
    connection = await mysql.createConnection({
      host: dbHost,
      port: dbPort,
      user: dbUsername,
      password: dbPassword,
      database: dbDatabase
    });
    
    console.log('Database connection established successfully');

    console.log('Starting user role migration...');

    // Get count of users
    const [totalUsersRows] = await connection.query('SELECT COUNT(*) as count FROM user');
    const totalUsers = totalUsersRows[0].count;
    console.log(`Total users in database: ${totalUsers}`);

    // Get users to update
    const [usersToUpdate] = await connection.query(
      `SELECT id, username, role FROM user WHERE role IN ('manager', 'general_manager')`
    );

    console.log(`Found ${usersToUpdate.length} users with roles to migrate`);

    // Log users that will be updated
    usersToUpdate.forEach((user) => {
      const newRole = user.role === 'manager' ? 'user' : 'leadership';
      console.log(`Will update user ${user.username} (${user.id}) from '${user.role}' to '${newRole}'`);
    });

    // Perform the updates
    let updatedCount = 0;
    
    // Update managers to user role
    const [managerResult] = await connection.query(
      `UPDATE user SET role = 'user' WHERE role = 'manager'`
    );
    updatedCount += managerResult.affectedRows || 0;
    
    // Update general_managers to leadership role
    const [gmResult] = await connection.query(
      `UPDATE user SET role = 'leadership' WHERE role = 'general_manager'`
    );
    updatedCount += gmResult.affectedRows || 0;

    console.log(`Successfully updated ${updatedCount} users`);
    console.log('User role migration completed successfully');

  } catch (error) {
    console.error('Error during user role migration:');
    console.error(error);
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('Database authentication failed. Check your DB_USERNAME and DB_PASSWORD in .env file.');
    }
  } finally {
    if (connection) {
      await connection.end();
      console.log('Database connection closed');
    }
    await app.close();
    console.log('NestJS application context closed');
  }
}

// Call the migration function
migrateUserRoles()
  .then(() => console.log('Migration script execution completed'))
  .catch(error => console.error('Migration script failed:', error)); 