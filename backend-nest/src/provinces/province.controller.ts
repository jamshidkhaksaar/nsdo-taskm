import { Controller, Get, Post, Put, Delete, Param, Body, NotFoundException } from '@nestjs/common';
import { ProvinceService } from './province.service';
import { Province } from './entities/province.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Department } from '../departments/entities/department.entity';

@Controller('provinces')
export class ProvinceController {
  constructor(
    private readonly provinceService: ProvinceService,
    @InjectRepository(Department)
    private readonly departmentRepository: Repository<Department>,
  ) {}

  @Get()
  async findAll(): Promise<Province[]> {
    return this.provinceService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Province> {
    return this.provinceService.findOne(id);
  }

  @Post()
  async create(@Body() data: Partial<Province>): Promise<Province> {
    return this.provinceService.create(data);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() data: Partial<Province>): Promise<Province> {
    return this.provinceService.update(id, data);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<void> {
    return this.provinceService.remove(id);
  }

  // Assign departments to a province
  @Post(':id/departments')
  async assignDepartments(
    @Param('id') provinceId: string,
    @Body() body: { departmentIds: string[] }
  ): Promise<Province> {
    const province = await this.provinceService.findOne(provinceId);
    if (!province) throw new NotFoundException('Province not found');
    // Update each department's provinceId
    await Promise.all(
      body.departmentIds.map(async (deptId) => {
        await this.departmentRepository.update(deptId, { provinceId });
      })
    );
    return this.provinceService.findOne(provinceId);
  }
}