import { Controller, Get, Param, Post, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { WorkflowsService } from './workflows.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../rbac/guards/roles.guard';
import { Roles } from '../../rbac/decorators/roles.decorator';
// import { RoleName } from '../../rbac/entities/role.entity'; // RoleName enum does not exist
import { UpdateWorkflowPermissionDto } from './dto/update-workflow-permission.dto';
import { WorkflowVisualizerDataDto } from './dto/workflow-visualizer-data.dto';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiParam } from '@nestjs/swagger';

@ApiTags('Admin - Workflows')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('Admin') // Use string literal for Admin role
@Controller('admin/workflows')
export class WorkflowsController {
  constructor(private readonly workflowsService: WorkflowsService) {}

  @Get(':workflowSlug/visualize')
  @ApiOperation({ summary: 'Get workflow data for visualization' })
  @ApiParam({ name: 'workflowSlug', description: 'Slug of the workflow (e.g., task-creation)', type: String })
  async getWorkflowVisualData(@Param('workflowSlug') workflowSlug: string): Promise<WorkflowVisualizerDataDto> {
    return this.workflowsService.getWorkflowVisualData(workflowSlug);
  }

  @Post('permissions')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a role-workflow_step permission' })
  async updateRoleWorkflowStepPermission(@Body() updateDto: UpdateWorkflowPermissionDto) {
    return this.workflowsService.updateRoleWorkflowStepPermission(updateDto);
  }

  // TODO: Add endpoints for CRUD of Workflows and WorkflowSteps if needed for admin UI
} 