import { Module, forwardRef } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { UsersModule } from "../users/users.module";
import { PassportModule } from "@nestjs/passport";
import { JwtModule } from "@nestjs/jwt";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { JwtStrategy } from "./strategies/jwt.strategy";
import { TwoFactorService } from "./two-factor.service";
import { TwoFactorController } from "./two-factor.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { User } from "../users/entities/user.entity";
import { MailModule } from "../mail/mail.module";
import { CaptchaModule } from "../captcha/captcha.module";
import { SettingsModule } from "../settings/settings.module";

@Module({
  imports: [
    forwardRef(() => UsersModule),
    TypeOrmModule.forFeature([User]),
    PassportModule.register({ defaultStrategy: "jwt" }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get("JWT_SECRET"),
        signOptions: {
          expiresIn: configService.get("JWT_EXPIRATION") || "3600s",
        },
      }),
    }),
    MailModule,
    CaptchaModule,
    forwardRef(() => SettingsModule),
  ],
  providers: [AuthService, JwtStrategy, TwoFactorService],
  controllers: [AuthController, TwoFactorController],
  exports: [AuthService, JwtStrategy, PassportModule, TwoFactorService],
})
export class AuthModule {}
