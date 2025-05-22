import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { Role } from '../../../rbac/entities/role.entity'; // Adjust path as necessary
import { WorkflowStep } from './workflow-step.entity';

@Entity('role_workflow_step_permissions')
@Index(['roleId', 'workflowStepId'], { unique: true })
export class RoleWorkflowStepPermission {
  @PrimaryColumn('uuid')
  roleId: string;

  @PrimaryColumn('uuid')
  workflowStepId: string;

  @ManyToOne(() => Role, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'roleId' })
  role: Role;

  @ManyToOne(() => WorkflowStep, (step) => step.rolePermissions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workflowStepId' })
  workflowStep: WorkflowStep;

  @Column({ default: false })
  hasPermission: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 