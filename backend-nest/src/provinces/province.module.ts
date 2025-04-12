import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Province } from './entities/province.entity';
import { Department } from '../departments/entities/department.entity';
import { ProvinceService } from './province.service';
import { ProvinceController } from './province.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Province, Department])],
  providers: [ProvinceService],
  controllers: [ProvinceController],
  exports: [ProvinceService],
})
export class ProvinceModule {}