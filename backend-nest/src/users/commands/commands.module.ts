import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';
import { UsersService } from '../users.service';
import { CreateAdminCommand } from './create-admin.command';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  providers: [UsersService, CreateAdminCommand],
  exports: [CreateAdminCommand],
})
export class CommandsModule {} 