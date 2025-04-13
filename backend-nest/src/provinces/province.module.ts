import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Province } from './entities/province.entity';
import { Department } from '../departments/entities/department.entity';
import { ProvinceService } from './province.service';
import { ProvinceController } from './province.controller';
import { DepartmentsModule } from '../departments/departments.module';
import { TasksModule } from '../tasks/tasks.module';
import { AdminModule } from '../admin/admin.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Province, Department]),
    forwardRef(() => DepartmentsModule),
    forwardRef(() => TasksModule),
    forwardRef(() => AdminModule),
  ],
  providers: [ProvinceService],
  controllers: [ProvinceController],
  exports: [ProvinceService, TypeOrmModule],
})
export class ProvinceModule {}