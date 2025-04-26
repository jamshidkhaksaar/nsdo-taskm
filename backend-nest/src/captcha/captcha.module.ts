import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config'; // Import ConfigModule if not global
import { CaptchaService } from './captcha.service';

@Module({
  imports: [
    HttpModule, // Import HttpModule for HttpService dependency
    ConfigModule, // ConfigService is used by CaptchaService
  ],
  providers: [CaptchaService],
  exports: [CaptchaService], // Export service for other modules to use
})
export class CaptchaModule {} 