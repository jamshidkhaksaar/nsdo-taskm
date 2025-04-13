import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, ParseUUIDPipe, HttpCode, HttpStatus, Request } from '@nestjs/common';
import { ProvinceService } from './province.service';
import { Province } from './entities/province.entity';
import { CreateProvinceDto } from './dto/create-province.dto';
import { UpdateProvinceDto } from './dto/update-province.dto';
import { Department } from '../departments/entities/department.entity';
import { DepartmentsService } from '../departments/departments.service';
import { AssignDepartmentsDto } from './dto/assign-departments.dto';
import { TasksService } from '../tasks/tasks.service';
import { ActivityLogService } from '../admin/services/activity-log.service';
// Auth related imports
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'; // Assuming JWT guard for auth
import { RolesGuard } from '../auth/guards/roles.guard'; // Import RolesGuard
import { Roles } from '../auth/decorators/roles.decorator'; // Import Roles decorator
import { UserRole } from '../users/entities/user.entity'; // Import UserRole enum
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';

@ApiTags('Admin - Provinces')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard) // Apply Auth and Roles guards
@Roles(UserRole.ADMIN) // Specify that only ADMIN role is allowed
@Controller('api/admin/provinces')
export class ProvinceController {
  constructor(
    private readonly provinceService: ProvinceService,
    private readonly departmentsService: DepartmentsService,
    private readonly tasksService: TasksService,
    private readonly activityLogService: ActivityLogService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new province (Admin Only)' })
  @ApiResponse({ status: 201, description: 'Province created successfully.', type: Province })
  @ApiResponse({ status: 400, description: 'Invalid input data.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden (Admin role required).' })
  async create(@Body() createProvinceDto: CreateProvinceDto): Promise<Province> {
    return this.provinceService.create(createProvinceDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all provinces (Admin Only)' })
  @ApiResponse({ status: 200, description: 'List of all provinces.', type: [Province] })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden (Admin role required).' })
  async findAll(): Promise<Province[]> {
    return this.provinceService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific province by ID (Admin Only)' })
  @ApiParam({ name: 'id', description: 'Province UUID', type: String })
  @ApiResponse({ status: 200, description: 'Province details.', type: Province })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden (Admin role required).' })
  @ApiResponse({ status: 404, description: 'Province not found.' })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Province> {
    return this.provinceService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a province by ID (Admin Only)' })
  @ApiParam({ name: 'id', description: 'Province UUID', type: String })
  @ApiResponse({ status: 200, description: 'Province updated successfully.', type: Province })
  @ApiResponse({ status: 400, description: 'Invalid input data.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden (Admin role required).' })
  @ApiResponse({ status: 404, description: 'Province not found.' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateProvinceDto: UpdateProvinceDto
  ): Promise<Province> {
    return this.provinceService.update(id, updateProvinceDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a province by ID (Admin Only)' })
  @ApiParam({ name: 'id', description: 'Province UUID', type: String })
  @ApiResponse({ status: 204, description: 'Province deleted successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden (Admin role required).' })
  @ApiResponse({ status: 404, description: 'Province not found.' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.provinceService.remove(id);
  }

  @Get(':provinceId/departments')
  @ApiOperation({ summary: 'Get departments assigned to a province (Admin Only)' })
  @ApiParam({ name: 'provinceId', description: 'Province UUID', type: String })
  @ApiResponse({ status: 200, description: 'List of departments in the province.', type: [Department] })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Province not found.' })
  async getProvinceDepartments(@Param('provinceId', ParseUUIDPipe) provinceId: string): Promise<Department[]> {
    const province = await this.provinceService.findOne(provinceId);
    return province.departments;
  }

  @Post(':provinceId/departments')
  @ApiOperation({ summary: 'Assign department(s) to a province (Admin Only)' })
  @ApiParam({ name: 'provinceId', description: 'Province UUID', type: String })
  @ApiResponse({ status: 200, description: 'Departments assigned successfully.', type: Province })
  @ApiResponse({ status: 400, description: 'Invalid input data (e.g., bad department IDs).' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Province or one/more Departments not found.' })
  async assignDepartmentsToProvince(
    @Param('provinceId', ParseUUIDPipe) provinceId: string,
    @Body() assignDepartmentsDto: AssignDepartmentsDto
  ): Promise<Province> {
    return this.departmentsService.assignDepartmentsToProvince(provinceId, assignDepartmentsDto.departmentIds);
  }

  @Delete(':provinceId/departments/:departmentId')
  @ApiOperation({ summary: 'Remove a department from a province (Admin Only)' })
  @ApiParam({ name: 'provinceId', description: 'Province UUID', type: String })
  @ApiParam({ name: 'departmentId', description: 'Department UUID to remove', type: String })
  @ApiResponse({ status: 204, description: 'Department removed successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Province or Department not found.' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeDepartmentFromProvince(
    @Param('provinceId', ParseUUIDPipe) provinceId: string,
    @Param('departmentId', ParseUUIDPipe) departmentId: string
  ): Promise<void> {
    await this.departmentsService.removeDepartmentFromProvince(provinceId, departmentId);
  }

  @Get('/:id/tasks')
  async getProvinceTasks(@Param('id') id: string, @Request() req) {
    const tasks = await this.tasksService.getTasksForProvince(id);
    
    try {
      const province = await this.provinceService.findOne(id);
      await this.activityLogService.logFromRequest(
        req,
        'view',
        'province_tasks',
        `Viewed tasks for province: ${province.name}`,
        id,
      );
    } catch (logError) {
      console.error(`Failed to log province task view activity: ${logError.message}`);
    }
    
    return tasks;
  }
}