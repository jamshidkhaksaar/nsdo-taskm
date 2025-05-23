import {
  Controller,
  Get,
  Put,
  Patch,
  Post,
  Body,
  Param,
  UseGuards,
  ValidationPipe,
} from "@nestjs/common";
import { SettingsService } from "./settings.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../rbac/guards/roles.guard";
import { Roles } from "../rbac/decorators/roles.decorator";
import { UpdateSecuritySettingsDto } from "./dto/update-security-settings.dto";
import { UpdateBackupSettingsDto } from "./dto/update-backup-settings.dto";
import { UpdateNotificationSettingsDto } from "./dto/update-notification-settings.dto";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { UpdateSettingsDto } from "./dto/update-settings.dto";
import { Setting } from "./entities/setting.entity";
import { TestSendGridDto } from "./dto/test-sendgrid.dto";
import { Logger } from "@nestjs/common";

@ApiTags("System Settings")
@ApiBearerAuth()
@Controller("settings")
@UseGuards(JwtAuthGuard, RolesGuard)
export class SettingsController {
  private readonly logger = new Logger(SettingsController.name);

  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @ApiOperation({ summary: "Get all system settings (Admin only)" })
  @ApiResponse({
    status: 200,
    description: "Returns all settings.",
    type: [Setting],
  })
  @ApiResponse({ status: 403, description: "Forbidden." })
  findAll() {
    return this.settingsService.getAllSettings();
  }

  @Put()
  @ApiOperation({ summary: "Update system settings (Admin only)" })
  @ApiResponse({
    status: 200,
    description: "Settings updated successfully.",
    type: [Setting],
  })
  @ApiResponse({ status: 400, description: "Invalid input data." })
  @ApiResponse({ status: 403, description: "Forbidden." })
  update(@Body(new ValidationPipe()) updateSettingsDto: UpdateSettingsDto) {
    // Add sanitization/validation logic here if needed, especially for API keys
    return this.settingsService.updateSettings(updateSettingsDto);
  }

  // Security Settings endpoints
  @Get("security-settings/:id")
  @ApiOperation({ summary: "Get security settings" })
  @ApiResponse({ status: 200, description: "Return security settings" })
  async getSecuritySettings(@Param("id") id: string) {
    return this.settingsService.getSecuritySettings(+id);
  }

  @Patch("security-settings/:id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN")
  @ApiOperation({ summary: "Update security settings" })
  @ApiResponse({
    status: 200,
    description: "Security settings updated successfully",
  })
  async updateSecuritySettings(
    @Param("id") id: string,
    @Body() updateSecuritySettingsDto: UpdateSecuritySettingsDto,
  ) {
    return this.settingsService.updateSecuritySettings(
      +id,
      updateSecuritySettingsDto,
    );
  }

  // Backup Settings endpoints
  @Get("backup-settings/:id")
  @ApiOperation({ summary: "Get backup settings" })
  @ApiResponse({ status: 200, description: "Return backup settings" })
  async getBackupSettings(@Param("id") id: string) {
    return this.settingsService.getBackupSettings(+id);
  }

  @Patch("backup-settings/:id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN")
  @ApiOperation({ summary: "Update backup settings" })
  @ApiResponse({
    status: 200,
    description: "Backup settings updated successfully",
  })
  async updateBackupSettings(
    @Param("id") id: string,
    @Body() updateBackupSettingsDto: UpdateBackupSettingsDto,
  ) {
    return this.settingsService.updateBackupSettings(
      +id,
      updateBackupSettingsDto,
    );
  }

  // Notification Settings endpoints
  @Get("notification-settings/:id")
  @ApiOperation({ summary: "Get notification settings" })
  @ApiResponse({ status: 200, description: "Return notification settings" })
  async getNotificationSettings(@Param("id") id: string) {
    return this.settingsService.getNotificationSettings(+id);
  }

  @Patch("notification-settings/:id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN")
  @ApiOperation({ summary: "Update notification settings" })
  @ApiResponse({
    status: 200,
    description: "Notification settings updated successfully",
  })
  async updateNotificationSettings(
    @Param("id") id: string,
    @Body() updateNotificationSettingsDto: UpdateNotificationSettingsDto,
  ) {
    return this.settingsService.updateNotificationSettings(
      +id,
      updateNotificationSettingsDto,
    );
  }

  @Post("test-email")
  @Roles("ADMIN")
  @ApiOperation({ summary: "Test email settings" })
  @ApiResponse({ status: 200, description: "Test email sent successfully" })
  @ApiResponse({ status: 400, description: 'Invalid settings or test failed' })
  async testEmailSettings() {
    this.logger.log("Received request to test email settings.");
    return this.settingsService.testEmailSettings();
  }

  // Endpoint to test SendGrid settings specifically
  @Post("test-sendgrid")
  @Roles("ADMIN")
  @ApiOperation({ summary: "Test SendGrid configuration (Admin only)" })
  @ApiResponse({
    status: 200,
    description: "Test email sent successfully or error message returned.",
  })
  @ApiResponse({
    status: 400,
    description: "Invalid input data or configuration error.",
  })
  @ApiResponse({ status: 403, description: "Forbidden." })
  async testSendGrid(
    @Body(new ValidationPipe()) testSendGridDto: TestSendGridDto,
  ) {
    return this.settingsService.testSendGridSettings(
      testSendGridDto.recipientEmail,
    );
  }
}
