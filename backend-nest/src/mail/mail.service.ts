import { Injectable, Logger, InternalServerErrorException } from "@nestjs/common";
import { MailerService } from "@nestjs-modules/mailer";
import { EmailTemplatesService } from "../email-templates/email-templates.service";

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(
    private readonly mailerService: MailerService,
    private readonly emailTemplatesService: EmailTemplatesService,
  ) {}

  /**
   * Renders an email template with the given context data.
   * Uses Handlebars-style placeholders like {{variableName}}.
   */
  private renderTemplate(
    templateBody: string,
    context: Record<string, any>,
  ): string {
    let renderedBody = templateBody;
    for (const key in context) {
      // Basic placeholder replacement - consider a more robust templating engine if needed
      const regex = new RegExp(`{{\s*${key}\s*}}`, "g");
      renderedBody = renderedBody.replace(regex, context[key]);
    }
    return renderedBody;
  }

  /**
   * Sends an email using a pre-defined template.
   *
   * @param to Recipient email address.
   * @param templateKey The key of the template to use (e.g., 'WELCOME_EMAIL').
   * @param context Data to fill into the template placeholders (e.g., { username: 'John Doe', link: '...' }).
   */
  async sendTemplatedEmail(
    to: string,
    templateKey: string,
    context: Record<string, any>,
  ): Promise<void> {
    try {
      // 1. Fetch the template
      const template = await this.emailTemplatesService.findOne(templateKey);
      if (!template) {
        this.logger.error(
          `Email template with key "${templateKey}" not found.`,
        );
        throw new InternalServerErrorException(`Email template '${templateKey}' not found.`);
      }
      this.logger.debug(`Fetched template "${templateKey}": Subject="${template.subject}"`);

      // 2. Render subject and body with context
      const subject = this.renderTemplate(template.subject, context);
      const html = this.renderTemplate(template.bodyHtml, context);

      // 3. Send the email
      await this.mailerService.sendMail({
        to: to,
        // From address is set in MailerModule defaults
        subject: subject,
        html: html,
        // You can add text version or attachments here if needed
      });

      this.logger.log(`Sent email using template "${templateKey}" to ${to}`);
    } catch (error) {
      this.logger.error(
        `Failed to send email using template "${templateKey}" to ${to}. Error: ${error?.message || error}`,
        error.stack,
      );
      throw new InternalServerErrorException(`Failed to send email for template '${templateKey}'.`);
    }
  }

  // Optional: Method for sending non-templated emails if needed
  async sendRawEmail(to: string, subject: string, html: string): Promise<void> {
    try {
      await this.mailerService.sendMail({ to, subject, html });
      this.logger.log(`Sent raw email to ${to} with subject "${subject}"`);
    } catch (error) {
      this.logger.error(
        `Failed to send raw email to ${to}: ${error.message}`,
        error.stack,
      );
    }
  }

  // --- Task Specific Email Methods ---

  async sendTaskAssignedEmail(user: { email: string; username: string }, task: { title: string; id: string; dueDate?: Date | null; description?: string }, creator: { username: string }, taskLink: string): Promise<void> {
    const context = {
      username: user.username,
      taskTitle: task.title,
      taskId: task.id,
      creatorName: creator.username,
      dueDate: task.dueDate ? task.dueDate.toLocaleDateString() : "N/A",
      taskDescription: task.description || "No description provided.",
      taskLink: taskLink,
    };
    await this.sendTemplatedEmail(user.email, "TASK_ASSIGNED_USER", context);
  }

  async sendTaskAssignedToDepartmentEmail(user: { email: string; username: string }, task: { title: string; id: string; dueDate?: Date | null; description?: string }, creator: { username: string }, taskLink: string, departmentDetails: string): Promise<void> {
    const context = {
      username: user.username,
      taskTitle: task.title,
      taskId: task.id,
      creatorName: creator.username,
      departmentDetails: departmentDetails, // e.g., "Finance (Kabul), HR (Herat)"
      dueDate: task.dueDate ? task.dueDate.toLocaleDateString() : "N/A",
      taskDescription: task.description || "No description provided.",
      taskLink: taskLink,
    };
    await this.sendTemplatedEmail(user.email, "TASK_ASSIGNED_DEPARTMENT", context);
  }

  async sendTaskDelegationRequestedEmail(creator: { email: string; username: string }, originalTask: { title: string; id: string }, delegator: { username: string }, delegatee: { username: string }, delegationReason: string, approvalLink: string, rejectionLink: string): Promise<void> {
    const context = {
      creatorUsername: creator.username,
      originalTaskTitle: originalTask.title,
      originalTaskId: originalTask.id,
      delegatorName: delegator.username,
      delegateeName: delegatee.username,
      delegationReason: delegationReason,
      approvalLink: approvalLink,
      rejectionLink: rejectionLink,
    };
    await this.sendTemplatedEmail(creator.email, "TASK_DELEGATION_REQUESTED", context);
  }

  async sendTaskDelegationStatusUpdateEmail(recipient: { email: string; username: string }, originalTask: { title: string; id: string }, isApproved: boolean, delegateeName?: string, rejectionReason?: string, taskLink?: string): Promise<void> {
    const context = {
      username: recipient.username,
      originalTaskTitle: originalTask.title,
      originalTaskId: originalTask.id,
      status: isApproved ? "approved" : "rejected",
      delegateeName: delegateeName, 
      rejectionReason: rejectionReason, 
      taskLink: taskLink, // Link to the main task or the new delegated task if applicable
    };
    const templateKey = isApproved ? "TASK_DELEGATION_APPROVED" : "TASK_DELEGATION_REJECTED";
    await this.sendTemplatedEmail(recipient.email, templateKey, context);
  }
}
