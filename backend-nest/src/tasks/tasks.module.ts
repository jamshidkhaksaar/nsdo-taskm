import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Task } from './entities/task.entity';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { UsersModule } from '../users/users.module';
import { DepartmentsModule } from '../departments/departments.module';
import { ProvinceModule } from '../provinces/province.module';
import { AdminModule } from '../admin/admin.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Task]),
    forwardRef(() => UsersModule),
    forwardRef(() => DepartmentsModule),
    forwardRef(() => ProvinceModule),
    forwardRef(() => AdminModule),
  ],
  controllers: [TasksController],
  providers: [TasksService],
  exports: [TypeOrmModule, TasksService],
})
export class TasksModule {}