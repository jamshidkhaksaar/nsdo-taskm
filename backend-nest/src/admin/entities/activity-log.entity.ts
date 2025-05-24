import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { User } from "../../users/entities/user.entity";

@Entity()
export class ActivityLog {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: "user_id" })
  user: User;

  @Column({ nullable: true })
  user_id: string;

  @Column()
  action: string;

  @Column()
  target: string;

  @Column({ nullable: true })
  target_id: string;

  @Column()
  details: string;

  @Column({ nullable: true })
  ip_address: string;

  @Column({
    type: "enum",
    enum: ["success", "warning", "error"],
    default: "success",
  })
  status: "success" | "warning" | "error";

  @CreateDateColumn()
  timestamp: Date;
}
