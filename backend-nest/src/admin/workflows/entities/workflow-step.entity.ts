import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Workflow } from './workflow.entity';
import { RoleWorkflowStepPermission } from './role-workflow-step-permission.entity';

@Entity('workflow_steps')
export class WorkflowStep {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  workflowId: string;

  @ManyToOne(() => Workflow, (workflow) => workflow.steps, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workflowId' })
  workflow: Workflow;

  @Column()
  name: string; // User-friendly name, e.g., "Create Personal Task"

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column()
  stepOrder: number;

  @Column({ unique: true })
  // Identifier used to link to actual permission checks, e.g., "task:create:personal"
  permissionIdentifier: string;

  @OneToMany(() => RoleWorkflowStepPermission, (rwsp) => rwsp.workflowStep, { cascade: true })
  rolePermissions: RoleWorkflowStepPermission[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 