import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Workflow } from './entities/workflow.entity';
import { WorkflowStep } from './entities/workflow-step.entity';
import { RoleWorkflowStepPermission } from './entities/role-workflow-step-permission.entity';
import { Role } from '../../rbac/entities/role.entity'; // Adjust path as necessary
import { UpdateWorkflowPermissionDto } from './dto/update-workflow-permission.dto';
import { WorkflowVisualizerDataDto, RoleNodeDto, WorkflowStepNodeDto, PermissionEdgeDto } from './dto/workflow-visualizer-data.dto';

@Injectable()
export class WorkflowsService {
  private readonly logger = new Logger(WorkflowsService.name);

  constructor(
    @InjectRepository(Workflow)
    private readonly workflowRepository: Repository<Workflow>,
    @InjectRepository(WorkflowStep)
    private readonly workflowStepRepository: Repository<WorkflowStep>,
    @InjectRepository(RoleWorkflowStepPermission)
    private readonly roleWorkflowStepPermissionRepository: Repository<RoleWorkflowStepPermission>,
    @InjectRepository(Role) // To fetch all roles
    private readonly roleRepository: Repository<Role>,
  ) {}

  async getWorkflowVisualData(workflowSlug: string): Promise<WorkflowVisualizerDataDto> {
    const workflow = await this.workflowRepository.findOne({
      where: { slug: workflowSlug },
      relations: ['steps'],
    });

    if (!workflow) {
      throw new NotFoundException(`Workflow with slug "${workflowSlug}" not found`);
    }

    const roles = await this.roleRepository.find();
    const rolePermissions = await this.roleWorkflowStepPermissionRepository.find({
      where: { workflowStepId: In(workflow.steps.map(s => s.id)) }, // Get all permissions for steps in this workflow
    });

    const roleNodes: RoleNodeDto[] = roles.map(role => ({
      id: role.id,
      name: role.name,
      description: role.description,
    }));

    const stepNodes: WorkflowStepNodeDto[] = workflow.steps.map(step => ({
      id: step.id,
      name: step.name,
      description: step.description,
      permissionIdentifier: step.permissionIdentifier,
      order: step.stepOrder,
    })).sort((a,b) => a.order - b.order);

    const permissionEdges: PermissionEdgeDto[] = rolePermissions.map(rp => ({
      roleId: rp.roleId,
      workflowStepId: rp.workflowStepId,
      hasPermission: rp.hasPermission,
    }));

    return {
      workflowId: workflow.id,
      workflowName: workflow.name,
      workflowSlug: workflow.slug,
      steps: stepNodes,
      roles: roleNodes,
      permissions: permissionEdges,
    };
  }

  async updateRoleWorkflowStepPermission(dto: UpdateWorkflowPermissionDto): Promise<RoleWorkflowStepPermission> {
    let permission = await this.roleWorkflowStepPermissionRepository.findOne({
      where: { roleId: dto.roleId, workflowStepId: dto.workflowStepId },
    });

    if (!permission) {
      permission = this.roleWorkflowStepPermissionRepository.create({
        roleId: dto.roleId,
        workflowStepId: dto.workflowStepId,
        hasPermission: dto.hasPermission,
      });
    } else {
      permission.hasPermission = dto.hasPermission;
    }

    return this.roleWorkflowStepPermissionRepository.save(permission);
  }

  // TODO: Add CRUD methods for Workflow and WorkflowStep if admin management of these is needed beyond seeding.
  // TODO: Add seeding logic for initial workflows and steps in onModuleInit or a separate seeder service.

   async onModuleInit() {
    await this.seedInitialWorkflow();
  }

  private async seedInitialWorkflow() {
    const workflowSlug = 'task-creation';
    let taskCreationWorkflow = await this.workflowRepository.findOneBy({ slug: workflowSlug });

    if (!taskCreationWorkflow) {
      this.logger.log(`Seeding "${workflowSlug}" workflow and its steps.`);
      taskCreationWorkflow = this.workflowRepository.create({
        name: 'Task Creation Workflow',
        slug: workflowSlug,
        description: 'Visualizes permissions related to creating and managing tasks.',
      });
      await this.workflowRepository.save(taskCreationWorkflow);

      const stepsToSeed: Partial<WorkflowStep>[] = [
        { name: 'Create Personal Task', permissionIdentifier: 'task:create:personal', stepOrder: 1, description: 'Allows user to create tasks for themselves.' },
        { name: 'Access QuickNotes', permissionIdentifier: 'dashboard:access:quicknote', stepOrder: 2, description: 'Allows user to access quick notes on dashboard.' }, // Example of a non-task one for variety
        { name: 'Assign Task to Users', permissionIdentifier: 'task:assign:user', stepOrder: 3, description: 'Allows assigning tasks to other individual users.' },
        { name: 'Assign Task to Departments', permissionIdentifier: 'task:assign:department', stepOrder: 4, description: 'Allows assigning tasks to one or more departments.' },
        { name: 'Assign Task to Provincial Depts', permissionIdentifier: 'task:assign:provincial_department', stepOrder: 5, description: 'Allows assigning tasks to departments within specific provinces.' },
        { name: 'Delegate Own Task (Dept Member)', permissionIdentifier: 'task:delegate:own_to_department_member', stepOrder: 6, description: 'Can delegate self-created tasks to a member of their own department.' },
        { name: 'Delegate Assigned Task (Dept Member)', permissionIdentifier: 'task:delegate:assigned_to_department_member', stepOrder: 7, description: 'Can delegate tasks assigned to them to another member of their own department.' },
        { name: 'Delete Own Task', permissionIdentifier: 'task:delete:own', stepOrder: 8, description: 'Can delete tasks they created.' },
        { name: 'Delete Task Assigned to Self', permissionIdentifier: 'task:delete:assigned_to_self', stepOrder: 9, description: 'Can delete tasks that are directly assigned to them.' },
        { name: 'Delete Task Delegated to Self', permissionIdentifier: 'task:delete:delegated_to_self', stepOrder: 10, description: 'Can delete tasks that were delegated to them.' },
        { name: 'View All Department Tasks', permissionIdentifier: 'task:view:department_tasks_all_users', stepOrder: 11, description: 'Can see all tasks within their assigned department(s), regardless of assignee.' },
        { name: 'View Delegated Department Tasks', permissionIdentifier: 'task:view:department_delegated_tasks', stepOrder: 12, description: 'Can see tasks delegated to their department(s).' },
      ];

      for (const stepData of stepsToSeed) {
        const newStep = this.workflowStepRepository.create({
          ...stepData,
          workflowId: taskCreationWorkflow.id,
        });
        await this.workflowStepRepository.save(newStep);
      }
      this.logger.log(`Finished seeding "${workflowSlug}" workflow and steps.`);
    } else {
      this.logger.log(`Workflow "${workflowSlug}" already exists. Skipping seeding.`);
    }
  }
} 