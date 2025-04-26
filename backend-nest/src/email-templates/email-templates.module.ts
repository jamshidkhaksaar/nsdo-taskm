import { Module, forwardRef } from '@nestjs/common';
import { EmailTemplatesService } from './email-templates.service';
import { EmailTemplatesController } from './email-templates.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmailTemplate } from './entities/email-template.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([EmailTemplate]),
    forwardRef(() => AuthModule),
  ],
  controllers: [EmailTemplatesController],
  providers: [EmailTemplatesService],
  exports: [EmailTemplatesService] // Export service for MailerModule and others
})
export class EmailTemplatesModule {} 