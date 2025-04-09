import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { UsersService } from '../src/users/users.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const usersService = app.get(UsersService);

  const username = 'admin';
  const email = 'admin@example.com';
  const password = 'jamshid123';

  try {
    const existing = await usersService.findOne(username);
    console.log(`Admin user '${username}' already exists with ID: ${existing.id}`);
  } catch (error) {
    console.log(`Creating admin user '${username}'...`);
    await usersService.createAdminUser(username, email, password);
    console.log('Admin user created successfully.');
  }

  await app.close();
}

bootstrap();