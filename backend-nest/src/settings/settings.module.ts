import { Module, forwardRef } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { SettingsController } from "./settings.controller";
import { SettingsService } from "./settings.service";
import { ApiSettings } from "./entities/api-settings.entity";
import { SecuritySettings } from "./entities/security-settings.entity";
import { BackupSettings } from "./entities/backup-settings.entity";
import { NotificationSettings } from "./entities/notification-settings.entity";
import { Setting } from "./entities/setting.entity";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ApiSettings,
      SecuritySettings,
      BackupSettings,
      NotificationSettings,
      Setting,
    ]),
    forwardRef(() => AuthModule),
  ],
  controllers: [SettingsController],
  providers: [SettingsService],
  exports: [SettingsService],
})
export class SettingsModule {}
