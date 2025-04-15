import { Entity, Column, OneToMany } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Department } from '../../departments/entities/department.entity';
import { Task } from '../../tasks/entities/task.entity';

@Entity()
export class Province {
  @Column({ type: 'varchar', length: 36, primary: true })
  id: string = uuidv4();

  @Column({ unique: true })
  name: string;

  @Column({ nullable: true })
  description: string;

  @OneToMany(() => Department, department => department.province)
  departments: Department[];

  @OneToMany(() => Task, task => task.assignedToProvince)
  assignedTasks: Task[];
}