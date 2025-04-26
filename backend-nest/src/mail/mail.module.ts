import { Module, forwardRef } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter'; // Or PugAdapter, EjsAdapter
import { MailService } from './mail.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SettingsModule } from '../settings/settings.module'; // Import SettingsModule
import { SettingsService } from '../settings/settings.service'; // Import SettingsService
import { EmailTemplatesModule } from '../email-templates/email-templates.module'; // <-- Import EmailTemplatesModule
import { join } from 'path';

@Module({
  imports: [
    forwardRef(() => SettingsModule), // Wrap SettingsModule here
    EmailTemplatesModule, // <-- Add EmailTemplatesModule here
    MailerModule.forRootAsync({
      imports: [ConfigModule, forwardRef(() => SettingsModule)], // Use ConfigModule here, not ConfigService
      inject: [ConfigService, SettingsService], // Inject services into factory
      useFactory: async (configService: ConfigService, settingsService: SettingsService) => {
        const sendGridApiKey = await settingsService.getSendGridApiKey();
        const defaultFromEmail = await settingsService.getEmailFromAddress() || configService.get<string>('MAIL_FROM') || 'no-reply@example.com';
        
        // Basic validation
        if (!sendGridApiKey) {
          console.warn('SendGrid API Key not found in settings. Email sending will likely fail.');
        }

        return {
          transport: {
            host: 'smtp.sendgrid.net',
            port: 587, // Standard port for SendGrid TLS
            secure: false, // Use TLS (automatically upgraded)
            auth: {
              user: 'apikey', // SendGrid requires 'apikey' as the user
              pass: sendGridApiKey || 'YOUR_FALLBACK_SENDGRID_API_KEY', // Use fetched key or a fallback/placeholder
            },
          },
          defaults: {
            from: `"${configService.get<string>('MAIL_FROM_NAME') || 'TaskM App'}" <${defaultFromEmail}>`,
          },
          template: {
            // dir: join(__dirname, 'templates'), // If using local templates
            // adapter: new HandlebarsAdapter(), 
            // options: {
            //   strict: true,
            // },
            // For now, we assume templates are managed via EmailTemplatesService and fetched dynamically
          },
        };
      },
    }),
  ],
  providers: [MailService],
  exports: [MailService], // Export MailService to be used in other modules
})
export class MailModule {} 