import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkflowsService } from './workflows.service';
import { WorkflowsController } from './workflows.controller';
import { Workflow } from './entities/workflow.entity';
import { WorkflowStep } from './entities/workflow-step.entity';
import { RoleWorkflowStepPermission } from './entities/role-workflow-step-permission.entity';
import { Role } from '../../rbac/entities/role.entity'; // Import Role entity
import { RbacModule } from '../../rbac/rbac.module'; // To use Role entity and RolesGuard
import { AuthModule } from '../../auth/auth.module'; // For JwtAuthGuard

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Workflow,
      WorkflowStep,
      RoleWorkflowStepPermission,
      Role, // Added Role here
    ]),
    RbacModule, // Provides RoleRepository and RolesGuard
    forwardRef(() => AuthModule), // Used forwardRef here
  ],
  controllers: [WorkflowsController],
  providers: [WorkflowsService],
  exports: [WorkflowsService],
})
export class WorkflowsModule {} 