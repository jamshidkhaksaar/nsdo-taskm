import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { UsersService } from '../src/users/users.service';
import * as bcrypt from 'bcrypt';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const usersService = app.get(UsersService);

  const username = 'admin';
  const newPassword = 'jamshid123';

  try {
    const user = await usersService.findOne(username);
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    await usersService.updatePassword(user.id, hashedPassword);
    console.log(`Password for admin user '${username}' has been reset.`);
  } catch (error) {
    console.error('Error resetting admin password:', error);
  }

  await app.close();
}

bootstrap();