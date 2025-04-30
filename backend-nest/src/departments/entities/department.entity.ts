import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { User } from "../../users/entities/user.entity";
import { Task } from "../../tasks/entities/task.entity";
import { Province } from "../../provinces/entities/province.entity";
import { v4 as uuidv4 } from "uuid";

@Entity()
export class Department {
  @Column({ type: "varchar", length: 36, primary: true })
  id: string = uuidv4();

  @Column({ unique: true })
  name: string;

  @Column({ nullable: true })
  description: string;

  @ManyToMany(() => User, (user) => user.departments)
  @JoinTable({
    name: "department_members",
    joinColumn: { name: "department_id", referencedColumnName: "id" },
    inverseJoinColumn: { name: "user_id", referencedColumnName: "id" },
  })
  members: User[];

  @Column({ name: "head_id", nullable: true })
  headId: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: "head_id" })
  head: User | null;

  @ManyToOne(() => Province, (province) => province.departments, {
    nullable: true,
  })
  province: Province | null;

  @Column({ nullable: true })
  provinceId: string | null;

  @ManyToMany(() => Task, (task) => task.assignedToDepartments)
  assignedTasks: Task[];

  @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  createdAt: Date;

  @Column({
    type: "timestamp",
    default: () => "CURRENT_TIMESTAMP",
    onUpdate: "CURRENT_TIMESTAMP",
  })
  updatedAt: Date;
}
