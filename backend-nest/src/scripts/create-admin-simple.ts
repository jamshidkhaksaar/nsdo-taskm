import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module'; // Assuming AppModule sets up TypeORM and UsersModule
import { UsersService } from '../users/users.service';
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
  // const email = 'it@nsdo.org.af'; // Not needed for findOne
  // const password = 'jamshid123'; // Not needed for findOne

  try {
    console.log(`Checking for user: ${username}...`);

    let foundUser;
    try {
      foundUser = await usersService.findOne(username);
      console.log('Found user:', JSON.stringify(foundUser, null, 2)); // Log found user details
    } catch (error) {
      if (error.status === 404) {
        console.error(`User '${username}' NOT FOUND in the database.`);
      } else {
        console.error('Error trying to find user:', error); // Log other errors
        throw error; // Re-throw unexpected errors
      }
    }

  } catch (error) {
    console.error('Script execution error:', error);
    process.exitCode = 1; // Indicate failure
  } finally {
    // Ensure the application context is closed
    await appContext.close();
    console.log('Application context closed.');
  }
}

bootstrap(); 