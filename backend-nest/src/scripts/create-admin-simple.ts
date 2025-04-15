import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module'; // Assuming AppModule sets up TypeORM and UsersModule
import { UsersService } from '../users/users.service';
import { UserRole } from '../users/entities/user.entity';
// import { UserRole } from '../users/entities/user.entity'; // No longer needed for check
// bcrypt is handled by UsersService.create, no longer needed here
// import * as bcrypt from 'bcrypt';

async function bootstrap() {
  // Create a standalone application context
  // This allows us to use the DI container without running the full HTTP server
  const appContext = await NestFactory.createApplicationContext(AppModule, {
    // Keep logger enabled for this check
    // logger: false, 
  });

  const usersService = appContext.get(UsersService);

  const username = 'admin';
  const email = 'admin@example.com';
  const password = 'jamshid123';
  const role = UserRole.ADMIN;

  try {
    console.log(`Checking for user: ${username}...`);
    let foundUser;
    try {
      foundUser = await usersService.findOne(username);
      if (foundUser) {
        console.log('Admin user already exists:', JSON.stringify(foundUser, null, 2));
        return;
      }
    } catch (error) {
      if (error.status === 404) {
        console.log(`User '${username}' not found. Creating admin user...`);
      } else {
        console.error('Error trying to find user:', error);
        throw error;
      }
    }

    // Create the admin user
    const newUser = await usersService.create(username, email, password, role);
    console.log('Admin user created:', JSON.stringify(newUser, null, 2));
  } catch (error) {
    console.error('Script execution error:', error);
    process.exitCode = 1;
  } finally {
    // Ensure the application context is closed
    await appContext.close();
    console.log('Application context closed.');
  }
}

bootstrap(); 