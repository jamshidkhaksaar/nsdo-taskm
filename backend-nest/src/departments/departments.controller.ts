import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { DepartmentsService } from './departments.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { Department } from './entities/department.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User, UserRole } from '../users/entities/user.entity';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('departments')
@UseGuards(JwtAuthGuard)
export class DepartmentsController {
  constructor(private departmentsService: DepartmentsService) {}

  @Get()
  getAllDepartments(): Promise<Department[]> {
    return this.departmentsService.findAll();
  }

  @Get('/:id')
  getDepartmentById(@Param('id') id: string): Promise<Department> {
    return this.departmentsService.findOne(id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  createDepartment(
    @Body() createDepartmentDto: CreateDepartmentDto,
  ): Promise<Department> {
    return this.departmentsService.create(createDepartmentDto);
  }

  @Patch('/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  updateDepartment(
    @Param('id') id: string,
    @Body() updateDepartmentDto: UpdateDepartmentDto,
  ): Promise<Department> {
    return this.departmentsService.update(id, updateDepartmentDto);
  }

  @Delete('/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  deleteDepartment(@Param('id') id: string): Promise<void> {
    return this.departmentsService.remove(id);
  }

  @Post('/:id/members/:userId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  addMember(
    @Param('id') id: string,
    @Param('userId') userId: string,
  ): Promise<Department> {
    return this.departmentsService.addMember(id, userId);
  }

  @Delete('/:id/members/:userId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  removeMember(
    @Param('id') id: string,
    @Param('userId') userId: string,
  ): Promise<Department> {
    return this.departmentsService.removeMember(id, userId);
  }

  @Get('/:id/performance')
  getDepartmentPerformance(@Param('id') id: string): Promise<any> {
    return this.departmentsService.getDepartmentPerformance(id);
  }
} 