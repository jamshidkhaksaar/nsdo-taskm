import { Controller, Put, Param, Body, UseGuards } from '@nestjs/common';
import { DepartmentsService } from '../../departments/departments.service';
import { UpdateDepartmentDto } from '../../departments/dto/update-department.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../users/entities/user.entity';

@Controller('admin/departments')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.LEADERSHIP)
export class AdminDepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  @Put(':id')
  async updateDepartment(
    @Param('id') id: string,
    @Body() updateDepartmentDto: UpdateDepartmentDto,
  ) {
    return this.departmentsService.update(id, updateDepartmentDto);
  }
} 