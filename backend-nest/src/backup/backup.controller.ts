import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Res,
  Logger,
  Req,
  UseGuards,
  ParseUUIDPipe,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { BackupService } from "./backup.service";
import { BackupOptionsDto } from "./dto/backup-options.dto";
import { Response, Request } from "express";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../rbac/guards/roles.guard";
import { Roles } from "../rbac/decorators/roles.decorator";

@ApiTags("Backups")
@Controller("backups")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("Super Admin")
export class BackupController {
  private readonly logger = new Logger(BackupController.name);

  constructor(private readonly backupService: BackupService) {
    this.logger.log("Backup controller initialized");
  }

  @Get()
  @ApiOperation({ summary: "Get all backups" })
  @ApiResponse({ status: 200, description: "Return all backups" })
  async getBackups() {
    this.logger.log("Getting all backups");
    return this.backupService.getBackups();
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a specific backup" })
  @ApiResponse({ status: 200, description: "Return the backup" })
  @ApiResponse({ status: 404, description: "Backup not found" })
  async getBackup(@Param("id", ParseUUIDPipe) id: string) {
    this.logger.log(`Getting backup with ID: ${id}`);
    return this.backupService.getBackup(id);
  }

  @Get(":id/status")
  @ApiOperation({ summary: "Check backup status" })
  @ApiResponse({ status: 200, description: "Return the backup status" })
  @ApiResponse({ status: 404, description: "Backup not found" })
  async checkBackupStatus(@Param("id", ParseUUIDPipe) id: string) {
    this.logger.log(`Checking status of backup with ID: ${id}`);
    const backup = await this.backupService.getBackup(id);
    return {
      id: backup.id,
      status: backup.status,
      name: backup.name,
      timestamp: backup.timestamp,
      error_message: backup.error_message || "",
    };
  }

  @Post("create_backup")
  @ApiOperation({ summary: "Create a new backup" })
  @ApiResponse({ status: 201, description: "Backup created successfully" })
  async createBackup(@Body() backupOptions: BackupOptionsDto) {
    this.logger.log(
      `Received backup options via DTO: ${JSON.stringify(backupOptions)}`,
    );
    return this.backupService.createBackup(backupOptions);
  }

  @Post(":id/restore")
  @ApiOperation({ summary: "Restore from a backup" })
  @ApiResponse({ status: 200, description: "System restored successfully" })
  @ApiResponse({ status: 404, description: "Backup not found" })
  async restoreBackup(@Param("id", ParseUUIDPipe) id: string) {
    this.logger.log(`Restoring backup with ID: ${id}`);
    return this.backupService.restoreBackup(id);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete a backup" })
  @ApiResponse({ status: 200, description: "Backup deleted successfully" })
  @ApiResponse({ status: 404, description: "Backup not found" })
  async deleteBackup(@Param("id", ParseUUIDPipe) id: string) {
    this.logger.log(`Deleting backup with ID: ${id}`);
    return this.backupService.deleteBackup(id);
  }

  @Get(":id/download")
  @ApiOperation({ summary: "Download a backup" })
  @ApiResponse({ status: 200, description: "Return the backup file" })
  @ApiResponse({ status: 404, description: "Backup not found" })
  async downloadBackup(
    @Param("id", ParseUUIDPipe) id: string,
    @Res() res: Response,
    @Req() req: Request,
  ) {
    this.logger.log(`Downloading backup with ID: ${id}`);

    try {
      const backup = await this.backupService.downloadBackup(id);

      res.setHeader("Content-Type", "application/sql");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=${backup.filename}`,
      );
      res.setHeader("Content-Length", backup.content.length);

      return res.end(backup.content);
    } catch (error) {
      this.logger.error(`Error downloading backup: ${error.message}`);

      // For API clients, return a proper error response
      if (req.headers["accept"] === "application/json") {
        return res.status(500).json({
          statusCode: 500,
          message: `Failed to download backup: ${error.message}`,
          error: "Internal Server Error",
        });
      }

      // For browser downloads, return a simple error SQL file
      const errorContent = `-- ERROR: Failed to download backup ${id}
-- Error message: ${error.message}
-- Timestamp: ${new Date().toISOString()}
-- This file is generated due to an error in the backup download process.`;

      res.setHeader("Content-Type", "application/sql");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=error_${id}.sql`,
      );
      res.setHeader("Content-Length", errorContent.length);

      return res.end(errorContent);
    }
  }
}
