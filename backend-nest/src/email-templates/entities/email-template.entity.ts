import {
  Entity,
  PrimaryColumn,
  Column,
  UpdateDateColumn,
  CreateDateColumn,
} from "typeorm";

@Entity("email_templates")
export class EmailTemplate {
  @PrimaryColumn({ type: "varchar", length: 100, unique: true })
  templateKey: string; // e.g., 'PASSWORD_RESET', 'TASK_ASSIGNED_USER', 'WELCOME_EMAIL'

  @Column({ type: "varchar", length: 255 })
  subject: string; // Subject line template (can include placeholders like {{username}})

  @Column("text")
  bodyHtml: string; // HTML body template (can include placeholders like {{link}}, {{taskTitle}})

  @Column({ type: "text", nullable: true })
  description: string; // Description of when this template is used

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
