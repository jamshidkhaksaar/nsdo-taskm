import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { EmailTemplatesService } from '../email-templates/email-templates.service';

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
  private renderTemplate(templateBody: string, context: Record<string, any>): string {
    let renderedBody = templateBody;
    for (const key in context) {
      // Basic placeholder replacement - consider a more robust templating engine if needed
      const regex = new RegExp(`{{\s*${key}\s*}}`, 'g');
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
        this.logger.error(`Email template with key "${templateKey}" not found.`);
        return; // Or throw an error
      }

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
      this.logger.error(`Failed to send email using template "${templateKey}" to ${to}: ${error.message}`, error.stack);
      // Handle error appropriately (e.g., log, retry, notify admin)
    }
  }

  // Optional: Method for sending non-templated emails if needed
  async sendRawEmail(to: string, subject: string, html: string): Promise<void> {
     try {
      await this.mailerService.sendMail({ to, subject, html });
      this.logger.log(`Sent raw email to ${to} with subject "${subject}"`);
    } catch (error) {
      this.logger.error(`Failed to send raw email to ${to}: ${error.message}`, error.stack);
    }
  }
} 