import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Department } from './entities/department.entity';
import { DepartmentsController } from './departments.controller';
import { DepartmentsService } from './departments.service';
import { UsersModule } from '../users/users.module';
import { AdminModule } from '../admin/admin.module';
import { DepartmentPerformersController } from './controllers/performers.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Department]),
    forwardRef(() => UsersModule),
    forwardRef(() => AdminModule),
  ],
  controllers: [DepartmentsController, DepartmentPerformersController],
  providers: [DepartmentsService],
  exports: [DepartmentsService],
})
export class DepartmentsModule {} 