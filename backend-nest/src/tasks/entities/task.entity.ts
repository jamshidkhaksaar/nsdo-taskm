import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, ManyToMany, JoinTable } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Department } from '../../departments/entities/department.entity';

export enum TaskStatus {
  TODO = 'TODO',
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  DONE = 'DONE',
}

@Entity()
export class Task {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column()
  description: string;

  @Column({
    type: 'enum',
    enum: TaskStatus,
    default: TaskStatus.OPEN,
  })
  status: TaskStatus;

  @Column({ nullable: true })
  createdById: string;

  @ManyToOne(() => User, user => user.createdTasks, { eager: false })
  @JoinColumn({ name: 'createdById' })
  createdBy: User;

  @ManyToMany(() => User, user => user.assignedTasks)
  @JoinTable({
    name: 'task_assignees',
    joinColumn: { name: 'task_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'user_id', referencedColumnName: 'id' },
  })
  assignedTo: User[];

  @Column({ nullable: true })
  departmentId: string;

  @ManyToOne(() => Department, department => department.tasks, { eager: false })
  @JoinColumn({ name: 'departmentId' })
  department: Department;
  
  @Column({ type: 'timestamp', nullable: true })
  dueDate: Date;
} 