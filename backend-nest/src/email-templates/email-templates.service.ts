import { Injectable, NotFoundException, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { EmailTemplate } from "./entities/email-template.entity";
import { UpdateEmailTemplateDto } from "./dto/email-template.dto";

@Injectable()
export class EmailTemplatesService {
  private readonly logger = new Logger(EmailTemplatesService.name);

  constructor(
    @InjectRepository(EmailTemplate)
    private emailTemplateRepository: Repository<EmailTemplate>,
  ) {}

  async onModuleInit() {
    // Optionally seed default templates if they don't exist
    await this.seedDefaultTemplates();
  }

  async seedDefaultTemplates() {
    const defaultTemplates: Omit<EmailTemplate, "createdAt" | "updatedAt">[] = [
      {
        templateKey: "WELCOME_EMAIL",
        subject: "Welcome to TaskM!",
        bodyHtml:
          '<p>Hello {{username}},</p><p>Welcome aboard! Your account has been created.</p><p>Your temporary password is: <strong>{{password}}</strong></p><p>Please login at <a href="{{loginLink}}">{{loginLink}}</a> and change your password.</p>',
        description: "Sent when an admin adds a new user.",
      },
      {
        templateKey: "PASSWORD_RESET_REQUEST",
        subject: "Password Reset Request",
        bodyHtml:
          '<p>Hello {{username}},</p><p>You requested a password reset. Click the link below to set a new password:</p><p><a href="{{resetLink}}">{{resetLink}}</a></p><p>If you didn\'t request this, please ignore this email.</p>',
        description: "Sent when a user initiates a password reset.",
      },
      {
        templateKey: "PASSWORD_CHANGED_CONFIRMATION",
        subject: "Your Password Has Been Changed",
        bodyHtml:
          "<p>Hello {{username}},</p><p>Your password was successfully changed. If you did not make this change, please contact support immediately.</p>",
        description: "Sent after a successful password change.",
      },
      {
        templateKey: "TASK_ASSIGNED_USER",
        subject: "New Task Assigned: {{taskTitle}}",
        bodyHtml:
          '<p>Hello {{username}},</p><p>A new task "{{taskTitle}}" has been assigned to you.</p><p>Due Date: {{dueDate}}</p><p>Details: {{taskDescription}}</p><p>View Task: <a href="{{taskLink}}">{{taskLink}}</a></p>',
        description: "Sent when a task is directly assigned to a user.",
      },
      {
        templateKey: "TASK_ASSIGNED_DEPARTMENT",
        subject: "New Task for Department: {{taskTitle}}",
        bodyHtml:
          '<p>Hello Team,</p><p>A new task "{{taskTitle}}" has been assigned to the {{departmentName}} department.</p><p>Due Date: {{dueDate}}</p><p>Details: {{taskDescription}}</p><p>View Task: <a href="{{taskLink}}">{{taskLink}}</a></p>',
        description:
          "Sent to users in a department when a task is assigned to that department.",
      },
      {
        templateKey: "TASK_DELEGATED",
        subject: "Task Delegated to You: {{taskTitle}}",
        bodyHtml:
          '<p>Hello {{assigneeUsername}},</p><p>The task "{{taskTitle}}" has been delegated to you by {{delegatorUsername}}.</p><p>Due Date: {{dueDate}}</p><p>Original Creator: {{creatorUsername}}</p><p>View Task: <a href="{{taskLink}}">{{taskLink}}</a></p>',
        description: "Sent when a task is delegated to a user.",
      },
      {
        templateKey: "TASK_STATUS_INPROGRESS",
        subject: "Task Update: '{{taskTitle}}' is In Progress",
        bodyHtml:
          '<p>Hello,</p><p>The task "{{taskTitle}}" status has been updated to In Progress by {{updaterUsername}}.</p><p>View Task: <a href="{{taskLink}}">{{taskLink}}</a></p>',
        description: "Sent when a task status changes to In Progress.",
      },
      {
        templateKey: "TASK_STATUS_DONE",
        subject: "Task Completed: {{taskTitle}}",
        bodyHtml:
          '<p>Hello,</p><p>The task "{{taskTitle}}" has been marked as Done by {{completerUsername}}.</p><p>View Task: <a href="{{taskLink}}">{{taskLink}}</a></p>',
        description: "Sent when a task is marked as Done.",
      },
      {
        templateKey: "TASK_STATUS_CANCELLED",
        subject: "Task Cancelled: {{taskTitle}}",
        bodyHtml:
          '<p>Hello,</p><p>The task "{{taskTitle}}" has been cancelled by {{cancellerUsername}}.</p><p>Reason: {{cancelReason}}</p><p>View Task: <a href="{{taskLink}}">{{taskLink}}</a></p>',
        description: "Sent when a task is cancelled.",
      },
      {
        templateKey: "TASK_DUE_REMINDER",
        subject: "Task Due Soon: {{taskTitle}}",
        bodyHtml:
          '<p>Hello {{username}},</p><p>Reminder: The task "{{taskTitle}}" is due on {{dueDate}}.</p><p>View Task: <a href="{{taskLink}}">{{taskLink}}</a></p>',
        description: "Sent as a reminder for upcoming task due dates.",
      },
      {
        templateKey: "DAILY_TASK_UPDATE",
        subject: "Your Daily Task Summary - {{date}}",
        bodyHtml:
          '<p>Hello {{username}},</p><p>Here is your task summary for today:</p><h4>Due Today:</h4><ul>{{dueTodayTasks}}</ul><h4>In Progress:</h4><ul>{{inProgressTasks}}</ul><h4>Overdue:</h4><ul>{{overdueTasks}}</ul><p>Manage your tasks: <a href="{{dashboardLink}}">{{dashboardLink}}</a></p>',
        description: "Daily summary of tasks for a user.",
      },
      {
        templateKey: "TWO_FACTOR_CODE_EMAIL",
        subject: "Verify Your Two-Factor Authentication Setup",
        bodyHtml:
          `<p>Hello {{username}},</p>
          <p>To complete setting up email as your two-factor authentication method, please use the following verification code:</p>
          <p style="font-size: 24px; font-weight: bold; letter-spacing: 2px; margin: 20px 0;">{{code}}</p>
          <p>Enter this code in the application to activate email-based 2FA. This code is a Time-based One-Time Password (TOTP) and will change frequently.</p>
          <p>If you did not request this, please ignore this email or contact support if you have concerns.</p>
          <p>Thank you,<br/>The TaskM Team</p>`,
        description: "Sent when a user is setting up email-based 2FA, contains the TOTP code for verification.",
      },
      {
        templateKey: "TWO_FACTOR_LOGIN_CODE",
        subject: "Your Two-Factor Authentication Code for TaskM",
        bodyHtml:
          `<p>Hello {{username}},</p>
          <p>Please use the following code to complete your login to TaskM:</p>
          <p style="font-size: 24px; font-weight: bold; letter-spacing: 2px; margin: 20px 0;">{{code}}</p>
          <p>This code is valid for {{validityMinutes}} minutes.</p>
          <p>If you did not attempt to log in, please secure your account immediately and contact support.</p>
          <p>Thank you,<br/>The TaskM Team</p>`,
        description: "Sent during login when 2FA is enabled and the method is email. Contains the login OTP.",
      },
      {
        templateKey: "NEW_LOGIN_NOTIFICATION",
        subject: "Security Alert: New Login to Your {{appName}} Account",
        bodyHtml:
          `<p>Hello {{username}},</p>
          <p>We detected a new login to your account on {{appName}}.</p>
          <ul>
            <li><strong>Time:</strong> {{loginTime}}</li>
            <li><strong>IP Address:</strong> {{ipAddress}}</li>
            <li><strong>Approximate Location:</strong> {{location}}</li>
            <li><strong>Browser:</strong> {{browserName}} ({{browserVersion}})</li>
            <li><strong>Operating System:</strong> {{osName}} ({{osVersion}})</li>
          </ul>
          <p>If this was you, you can safely ignore this email.</p>
          <p>If you do not recognize this activity, please secure your account immediately by <a href="{{resetPasswordLink}}">resetting your password</a> and review your account settings. If you need further assistance, contact our support team.</p>
          <p>Thank you,<br/>The {{appName}} Team</p>`,
        description: "Sent to a user when a new login is detected from an unrecognized device/browser or under specific security conditions.",
      },
      // --- Task Delegation Templates ---
      {
        templateKey: "TASK_DELEGATION_REQUESTED",
        subject: "Action Required: Task Delegation Request for '{{originalTaskTitle}}'",
        bodyHtml:
          '<p>Hello {{creatorUsername}},</p>' +
          '<p>User {{delegatorName}} has requested to delegate the task "{{originalTaskTitle}}" (ID: {{originalTaskId}}) to {{delegateeName}}.</p>' +
          '<p>Reason provided: {{delegationReason}}</p>' +
          '<p>Please review this request:</p>' +
          '<p><a href="{{approvalLink}}">Approve Delegation</a></p>' +
          '<p><a href="{{rejectionLink}}">Reject Delegation</a></p>' +
          '<p>If you do not take action, the task will remain as is.</p>',
        description: "Sent to the task creator when an assignee requests to delegate a task.",
      },
      {
        templateKey: "TASK_DELEGATION_APPROVED",
        subject: "Delegation Approved: '{{originalTaskTitle}}' is now assigned to {{delegateeName}}",
        bodyHtml:
          '<p>Hello {{username}},</p>' +
          '<p>The delegation request for task "{{originalTaskTitle}}" (ID: {{originalTaskId}}) has been <strong>approved</strong>.</p>' +
          '<p>The task is now assigned to {{delegateeName}}.</p>' +
          '{{#if taskLink}}<p>View the task: <a href="{{taskLink}}">{{taskLink}}</a></p>{{/if}}',
        description: "Sent to the delegator and delegatee when a task delegation is approved by the creator.",
      },
      {
        templateKey: "TASK_DELEGATION_REJECTED",
        subject: "Delegation Rejected: '{{originalTaskTitle}}'",
        bodyHtml:
          '<p>Hello {{username}},</p>' +
          '<p>The delegation request for task "{{originalTaskTitle}}" (ID: {{originalTaskId}}) to {{delegateeName}} has been <strong>rejected</strong> by the creator.</p>' +
          '{{#if rejectionReason}}<p>Reason: {{rejectionReason}}</p>{{/if}}' +
          '<p>The task remains with its current assignees.</p>' +
          '{{#if taskLink}}<p>View the original task: <a href="{{taskLink}}">{{taskLink}}</a></p>{{/if}}',
        description: "Sent to the delegator when a task delegation is rejected by the creator.",
      },
      // --- Task Assignment Change Templates ---
      {
        templateKey: "TASK_NEWLY_ASSIGNED",
        subject: "New Task Assignment: {{taskTitle}}",
        bodyHtml:
          '<p>Hello {{username}},</p>' +
          '<p>You have been assigned to the task "{{taskTitle}}" by {{actorUsername}}.</p>' +
          '<p>Due Date: {{dueDate}}</p>' +
          '<p>Details: {{taskDescription}}</p>' +
          '<p>View Task: <a href="{{taskLink}}">{{taskLink}}</a></p>',
        description: "Sent to a user when they are newly assigned to a task (e.g., via reassignment).",
      },
      {
        templateKey: "TASK_REMOVED_FROM_ASSIGNMENT",
        subject: "Task Assignment Update: You are no longer assigned to {{taskTitle}}",
        bodyHtml:
          '<p>Hello {{username}},</p>' +
          '<p>You have been removed from the assignments for task "{{taskTitle}}" by {{actorUsername}}.</p>' +
          '<p>View Task Details: <a href="{{taskLink}}">{{taskLink}}</a></p>',
        description: "Sent to a user when they are removed from a task's assignments.",
      },
      {
        templateKey: "TASK_ASSIGNMENT_CHANGED",
        subject: "Assignments Updated for Task: {{taskTitle}}",
        bodyHtml:
          '<p>Hello {{username}},</p>' +
          '<p>The assignments for the task "{{taskTitle}}" (which you created) have been updated by {{changerUsername}}.</p>' +
          '<p>Please review the changes.</p>' +
          '<p>View Task: <a href="{{taskLink}}">{{taskLink}}</a></p>',
        description: "Sent to the task creator when assignments for their task are changed by someone else.",
      },
    ];

    for (const templateData of defaultTemplates) {
      const existing = await this.emailTemplateRepository.findOneBy({
        templateKey: templateData.templateKey,
      });
      if (!existing) {
        try {
          const newTemplate = this.emailTemplateRepository.create(templateData);
          await this.emailTemplateRepository.save(newTemplate);
          this.logger.log(`Seeded email template: ${templateData.templateKey}`);
        } catch (error) {
          this.logger.error(
            `Failed to seed template ${templateData.templateKey}: ${error.message}`,
          );
        }
      }
    }
  }

  async findAll(): Promise<EmailTemplate[]> {
    return this.emailTemplateRepository.find({ order: { templateKey: "ASC" } });
  }

  async findOne(templateKey: string): Promise<EmailTemplate> {
    const template = await this.emailTemplateRepository.findOneBy({
      templateKey,
    });
    if (!template) {
      throw new NotFoundException(
        `Email template with key "${templateKey}" not found.`,
      );
    }
    return template;
  }

  async update(
    templateKey: string,
    updateEmailTemplateDto: UpdateEmailTemplateDto,
  ): Promise<EmailTemplate> {
    const template = await this.emailTemplateRepository.preload({
      templateKey: templateKey,
      ...updateEmailTemplateDto,
    });
    if (!template) {
      throw new NotFoundException(
        `Email template with key "${templateKey}" not found.`,
      );
    }
    return this.emailTemplateRepository.save(template);
  }

  async remove(templateKey: string): Promise<void> {
    const template = await this.findOne(templateKey); // Reuse findOne to ensure it exists
    if (!template) {
      // findOne already throws NotFoundException, but as a safeguard:
      throw new NotFoundException(
        `Email template with key "${templateKey}" not found for deletion.`,
      );
    }
    // Prevent deletion of core system templates if necessary (optional)
    // const coreTemplates = ["WELCOME_EMAIL", "PASSWORD_RESET_REQUEST", ...];
    // if (coreTemplates.includes(templateKey)) {
    //   throw new BadRequestException(`Core template "${templateKey}" cannot be deleted.`);
    // }

    const result = await this.emailTemplateRepository.delete({ templateKey });

    if (result.affected === 0) {
      // This case should ideally be caught by findOne, but good for robustness
      this.logger.warn(
        `Attempted to delete non-existent template key: ${templateKey}`,
      );
      throw new NotFoundException(
        `Email template with key "${templateKey}" not found during delete operation.`,
      );
    }
    this.logger.log(`Successfully deleted email template: ${templateKey}`);
  }
}
