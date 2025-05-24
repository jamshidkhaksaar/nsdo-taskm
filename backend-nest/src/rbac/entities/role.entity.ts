import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
  JoinTable,
  OneToMany,
  Index,
} from "typeorm";
import { Permission } from "./permission.entity";
import { User } from "../../users/entities/user.entity"; // Adjust path as needed

@Entity("roles")
export class Role {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Index({ unique: true })
  @Column({ type: "varchar", length: 50, unique: true })
  name: string;

  @Column({ type: "text", nullable: true })
  description: string;

  @Column({ type: "boolean", default: false, name: "is_system_role" })
  isSystemRole: boolean; // Prevents deletion if true

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;

  // --- Relationships ---

  @ManyToMany(() => Permission, (permission) => permission.roles, {
    cascade: ["insert", "update"], // Decide on cascade options
  })
  @JoinTable({
    name: "role_permissions", // Explicitly name the join table
    joinColumn: { name: "role_id", referencedColumnName: "id" },
    inverseJoinColumn: { name: "permission_id", referencedColumnName: "id" },
  })
  permissions: Permission[];

  // Define the inverse side of the ManyToOne relationship from User
  @OneToMany(() => User, (user) => user.role)
  users: User[];
}
