import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { HttpModule } from "@nestjs/axios";
import { CaptchaService } from "./captcha.service";

@Module({
  imports: [
    ConfigModule, // Import ConfigModule to use ConfigService
    HttpModule, // Import HttpModule to use HttpService
  ],
  providers: [CaptchaService],
  exports: [CaptchaService], // Export CaptchaService so other modules can use it
})
export class CaptchaModule {}
