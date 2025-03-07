import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Put,
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
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async getAllDepartments() {
    const departments = await this.departmentsService.findAll();
    const formattedDepartments = await Promise.all(
      departments.map(department => this.formatDepartmentResponse(department))
    );
    return formattedDepartments;
  }

  @Get('/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async getDepartmentById(@Param('id') id: string) {
    const department = await this.departmentsService.findOne(id);
    return await this.formatDepartmentResponse(department);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async createDepartment(
    @Body() createDepartmentDto: CreateDepartmentDto,
  ) {
    const department = await this.departmentsService.create(createDepartmentDto);
    return await this.formatDepartmentResponse(department);
  }

  @Put('/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async updateDepartment(
    @Param('id') id: string,
    @Body() updateDepartmentDto: UpdateDepartmentDto,
  ) {
    const department = await this.departmentsService.update(id, updateDepartmentDto);
    return await this.formatDepartmentResponse(department);
  }

  @Delete('/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  deleteDepartment(@Param('id') id: string): Promise<void> {
    return this.departmentsService.remove(id);
  }

  @Post('/:id/members/:userId/')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async addMember(
    @Param('id') id: string,
    @Param('userId') userId: string,
  ) {
    const department = await this.departmentsService.addMember(id, userId);
    return await this.formatDepartmentResponse(department);
  }

  @Delete('/:id/members/:userId/')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async removeMember(
    @Param('id') id: string,
    @Param('userId') userId: string,
  ) {
    const department = await this.departmentsService.removeMember(id, userId);
    return await this.formatDepartmentResponse(department);
  }

  @Get('/:id/performance')
  getDepartmentPerformance(@Param('id') id: string): Promise<any> {
    return this.departmentsService.getDepartmentPerformance(id);
  }

  // Helper method to format department responses
  private async formatDepartmentResponse(department: Department) {
    console.log(`Formatting department ${department.id}: head info:`, 
      department.head ? 
      { id: department.head.id, username: department.head.username } : 
      'No head assigned');
    console.log(`Department headId: ${department.headId}`);
    
    // Format the head name from head object if it exists
    let head_name = 'No Head Assigned';
    let head = department.head;
    
    // If we have a headId but no valid head object, try to load the head user
    if (department.headId && (!department.head || !department.head.username)) {
      try {
        const headUser = await this.departmentsService.getUserById(department.headId);
        if (headUser) {
          head = headUser;
          console.log(`Loaded head user for formatting: ${head.username}`);
        }
      } catch (error) {
        console.error(`Error loading head user for formatting: ${error.message}`);
      }
    }
    
    if (head && head.username) {
      head_name = head.username;
      console.log(`Set head_name to ${head_name} for department ${department.id}`);
    }
    
    // Get members count - first try from the department.members array
    let members_count = department.members ? department.members.length : 0;
    
    // If members_count is 0, try a direct query to double-check
    if (members_count === 0) {
      try {
        // Get count directly from the junction table
        const memberCountResult = await this.departmentsService.getMemberCount(department.id);
        if (memberCountResult > 0) {
          members_count = memberCountResult;
          console.log(`Updated member count from direct query: ${members_count}`);
        }
      } catch (error) {
        console.error(`Error getting direct member count: ${error.message}`);
      }
    }
    
    // Format members data properly for the frontend
    const members = department.members ? department.members.map(member => {
      // Simplify to use just the available properties
      return {
        id: member.id,
        name: member.username || 'Unknown User',
        avatar: null
      };
    }) : [];
    
    console.log(`Department ${department.id} has ${members_count} members:`, 
      members.length > 0 ? members.map(m => `${m.name} (${m.id})`).join(', ') : 'None');
    
    // Get tasks count for active projects (simplified)
    const active_projects = department.tasks ? 
      department.tasks.filter(task => task.status !== 'DONE').length > 0 ? 1 : 0 : 
      0;
    
    // Calculate completion rate
    const totalTasks = department.tasks ? department.tasks.length : 0;
    const completedTasks = department.tasks ? 
      department.tasks.filter(task => task.status === 'DONE').length : 
      0;
    const completion_rate = totalTasks > 0 ? 
      Math.round((completedTasks / totalTasks) * 100) : 
      0;
    
    // Create a formatted response
    const result = {
      id: department.id,
      name: department.name,
      description: department.description,
      head: head || department.head,
      head_name,
      members_count,
      members,
      active_projects,
      completion_rate,
      createdAt: department.createdAt,
      updatedAt: department.updatedAt
    };
    
    console.log('Formatted department result: ', {
      id: result.id,
      name: result.name,
      head_name: result.head_name,
      members_count: result.members_count,
      members: members.length
    });
    
    return result;
  }
} 