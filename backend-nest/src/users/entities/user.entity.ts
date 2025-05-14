import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Exclude } from "class-transformer";
import { Task } from "../../tasks/entities/task.entity";
import { Department } from "../../departments/entities/department.entity";
import { Note } from "../../notes/entities/note.entity";
import { v4 as uuidv4 } from "uuid";
import { Role } from "../../rbac/entities/role.entity";

@Entity("user")
export class User {
  @Column({ type: "varchar", length: 36, primary: true })
  id: string = uuidv4();

  @Column({ unique: true })
  username: string;

  @Column({ unique: true })
  email: string;

  @Column()
  @Exclude({ toPlainOnly: true })
  password: string;

  @Column({ default: true })
  isActive: boolean;

  @ManyToOne(() => Role, (role) => role.users, {
    nullable: true,
    onDelete: "SET NULL",
    eager: true,
  })
  @JoinColumn({ name: "role_id" })
  role: Role;

  @Column({ default: false, name: "two_factor_enabled" })
  twoFactorEnabled: boolean;

  @Column({ type: 'text', nullable: true, name: "two_factor_secret" })
  @Exclude({ toPlainOnly: true })
  twoFactorSecret: string | null;

  @Column({ type: "varchar", length: 10, nullable: true, name: "login_otp" })
  @Exclude({ toPlainOnly: true })
  loginOtp: string | null;

  @Column({ nullable: true, type: "timestamp", name: "login_otp_expires_at" })
  loginOtpExpiresAt: Date | null;

  @Column({ type: "varchar", length: 128, nullable: true, name: "reset_password_token" })
  @Exclude({ toPlainOnly: true })
  resetPasswordToken: string | null;

  @Column({ nullable: true, type: "timestamp", name: "reset_password_expires" })
  resetPasswordExpires: Date | null;

  @Column({ nullable: true })
  position: string;

  @Column({ default: "app", name: "two_factor_method" })
  twoFactorMethod: string; // 'app' for authenticator app, 'email' for email-based 2FA

  @Column({ type: "json", nullable: true, name: "remembered_browsers" })
  rememberedBrowsers: { fingerprint: string; expiresAt: Date }[];

  @Column({ nullable: true, type: "text" })
  bio: string;

  @Column({ nullable: true, name: "avatar_url" })
  avatarUrl: string;

  @Column({ type: "simple-array", nullable: true })
  skills: string[];

  @Column({ type: "json", nullable: true, name: "social_links" })
  socialLinks: Record<string, string>;

  @Column({ type: "json", nullable: true })
  preferences: Record<string, any>;

  @Column({
    type: "timestamp",
    default: () => "CURRENT_TIMESTAMP",
    name: "created_at",
  })
  createdAt: Date;

  @Column({
    type: "timestamp",
    default: () => "CURRENT_TIMESTAMP",
    onUpdate: "CURRENT_TIMESTAMP",
    name: "updated_at",
  })
  updatedAt: Date;

  @OneToMany(() => Task, (task) => task.createdBy)
  createdTasks: Task[];

  @ManyToMany(() => Task, (task) => task.assignedToUsers)
  assignedTasks: Task[];

  @ManyToMany(() => Department, (department) => department.members)
  @JoinTable({
    name: "user_departments",
    joinColumn: { name: "user_id", referencedColumnName: "id" },
    inverseJoinColumn: { name: "department_id", referencedColumnName: "id" },
  })
  departments: Department[];

  @OneToMany(() => Note, (note) => note.user)
  notes: Note[];
}
