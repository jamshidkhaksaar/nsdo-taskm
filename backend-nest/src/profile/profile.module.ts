import { Module, forwardRef } from "@nestjs/common";
import { ProfileController } from "./profile.controller";
import { ProfileService } from "./profile.service";
import { UsersModule } from "../users/users.module";
import { AuthModule } from "../auth/auth.module";
import { AdminModule } from "../admin/admin.module";

@Module({
  imports: [
    forwardRef(() => UsersModule),
    forwardRef(() => AuthModule),
    forwardRef(() => AdminModule),
  ],
  controllers: [ProfileController],
  providers: [ProfileService],
  exports: [ProfileService],
})
export class ProfileModule {}
