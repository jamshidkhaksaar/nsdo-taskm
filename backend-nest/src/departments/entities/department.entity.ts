import { Column, Entity, JoinTable, ManyToMany, OneToMany, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Task } from '../../tasks/entities/task.entity';
import { Province } from '../../provinces/entities/province.entity';

@Entity()
export class Department {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column({ nullable: true })
  description: string;

  @ManyToMany(() => User, user => user.departments)
  @JoinTable({
    name: 'department_members',
    joinColumn: { name: 'department_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'user_id', referencedColumnName: 'id' },
  })
  members: User[];

  @Column({ nullable: true })
  headId: string;

  @ManyToMany(() => User)
  @JoinTable({
    name: 'department_heads',
    joinColumn: { name: 'department_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'head_id', referencedColumnName: 'id' },
  })
  head: User | null;

  @ManyToOne(() => Province, province => province.departments, { nullable: true })
  province: Province | null;

  @Column({ nullable: true })
  provinceId: string | null;

  @ManyToMany(() => Task, task => task.assignedToDepartments)
  assignedTasks: Task[];

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}