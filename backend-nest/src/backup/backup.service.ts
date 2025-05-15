import { Injectable, NotFoundException, Logger, OnModuleInit } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import * as fs from "fs-extra";
import * as path from "path";
import * as os from "os";
import * as child_process from "child_process";
import * as util from "util";
import { ConfigService } from "@nestjs/config";
import { BackupOptionsDto } from "./dto/backup-options.dto";
import { Backup, BackupStatus, BackupType } from "./entities/backup.entity";
import * as fs_extra from "fs-extra";
import { v4 as uuidv4 } from "uuid";
const pgPromise = require('pg-promise');
import * as zlib from 'zlib';

@Injectable()
export class BackupService implements OnModuleInit {
  private readonly logger = new Logger(BackupService.name);
  private backups: Backup[] = [];
  private readonly dbBackupDir: string;
  private readonly pgp: any;
  private readonly dbConnectionOptions: any;

  constructor(
    @InjectRepository(Backup)
    private readonly backupRepository: Repository<Backup>,
    private readonly configService: ConfigService,
  ) {
    this.dbBackupDir = path.join(process.cwd(), "pg_backups");
    // Log configuration to help with debugging
    console.log(
      `[BackupService] Using database host: ${this.configService.get<string>("DATABASE_HOST", "localhost")}`,
    );
    console.log(
      `[BackupService] Using database port: ${this.configService.get<number>("DATABASE_PORT", 3306)}`,
    );
    this.pgp = pgPromise({});
    const dbUrl = this.configService.get<string>("DATABASE_URL");
    if (!dbUrl) {
      this.logger.error("DATABASE_URL is not configured. pg-promise setup will fail.");
      this.dbConnectionOptions = {};
    } else {
      this.dbConnectionOptions = { connectionString: dbUrl };
    }
  }

  async getBackups(): Promise<Backup[]> {
    // Always return at least the initial set of backups
    try {
      const backups = await this.backupRepository.find({
        where: { is_deleted: false },
        order: { timestamp: "DESC" },
      });

      console.log(`Found ${backups.length} backups`);

      return backups;
    } catch (error) {
      console.error("Error fetching backups:", error);
      return [];
    }
  }

  async getBackup(id: string): Promise<Backup> {
    console.log(`Looking for backup with ID: ${id}`);

    // Handle direct database lookup first
    let backup: Backup | null = null;
    try {
      backup = await this.backupRepository.findOne({
        where: { id, is_deleted: false },
      });

      if (backup) {
        console.log(`Found backup: ${backup.id}`);
        return backup;
      }
    } catch (error) {
      // Log the error but proceed to throw NotFoundException below
      console.error(`Error finding backup: ${error.message}`);
    }

    // Fallback logic for demo purposes block fully removed.

    // If backup is null after the try-catch or wasn't found
    if (!backup) {
      throw new NotFoundException(`Backup with ID ${id} not found`);
    }

    // This line should technically be unreachable if backup is null due to the throw above,
    // but satisfies TypeScript if the try/catch didn't re-throw.
    return backup;
  }

  async createBackup(options: BackupOptionsDto): Promise<Backup> {
    console.log("Creating backup with options:", options);

    // Create backup directory if it doesn't exist
    const backupDir =
      options.customPath || path.join(os.tmpdir(), "mysql_backups");
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    // For compatibility with frontend, let's use a specific ID format
    const backupIdNumber = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0");
    const backupId = `backup-${backupIdNumber}`;

    // Create a new backup entity
    const newBackup = this.backupRepository.create({
      id: backupId, // Set the ID explicitly
      name:
        options.type === "full" ? "Full MySQL Backup" : "Partial MySQL Backup",
      type: options.type as BackupType,
      status: BackupStatus.IN_PROGRESS,
      notes: `Manual ${options.type} backup`,
      size: "0 KB", // Add default size value to prevent SQL error
      // In a real implementation, createdBy would be set from the authenticated user
    });

    try {
      // Save the backup to the database
      await this.backupRepository.save(newBackup);

      // Run the backup in the background
      this.performMySQLBackup(newBackup.id, backupDir, options).catch(
        (error) => {
          console.error("Error during MySQL backup:", error);
          this.updateBackupStatus(
            newBackup.id,
            BackupStatus.FAILED,
            error.message || "Unknown error during backup process",
          );
        },
      );

      return newBackup;
    } catch (error) {
      console.error("Error saving backup record:", error.message);
      throw new Error(`Failed to create backup: ${error.message}`);
    }
  }

  private async performMySQLBackup(
    backupId: string,
    backupDir: string,
    options: BackupOptionsDto,
  ): Promise<void> {
    try {
      // Get database configuration from .env via ConfigService
      const dbHost = this.configService.get("DATABASE_HOST");
      const dbPort = this.configService.get("DATABASE_PORT");
      const dbUser = this.configService.get("DATABASE_USERNAME");
      const dbPassword = this.configService.get("DATABASE_PASSWORD");
      const dbName = this.configService.get("DATABASE_NAME");

      // Define backup file path
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const backupFileName = `mysql_backup_${backupId}_${timestamp}.sql`;
      const backupFilePath = path.join(backupDir, backupFileName);

      // Construct mysqldump command
      // We're using environment variables for the password to avoid it showing in process list
      let mysqldumpCommand: string;

      if (process.platform === "win32") {
        // Windows command
        mysqldumpCommand = `mysqldump --host=${dbHost} --port=${dbPort} --user=${dbUser} --password=${dbPassword} ${options.includeDatabases ? dbName : "--no-data " + dbName} > "${backupFilePath}"`;
      } else {
        // Unix command
        mysqldumpCommand = `MYSQL_PWD="${dbPassword}" mysqldump --host=${dbHost} --port=${dbPort} --user=${dbUser} ${options.includeDatabases ? dbName : "--no-data " + dbName} > "${backupFilePath}"`;
      }

      // Execute the backup command
      const exec = util.promisify(child_process.exec);
      await exec(mysqldumpCommand);

      // Get file size
      const stats = fs.statSync(backupFilePath);
      const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);

      // Update backup record with success status
      await this.updateBackupStatus(
        backupId,
        BackupStatus.COMPLETED,
        undefined,
        backupFilePath,
        `${fileSizeInMB} MB`,
      );

      console.log(`MySQL backup completed and saved to: ${backupFilePath}`);
    } catch (error) {
      console.error("MySQL backup failed:", error);
      throw error;
    }
  }

  private async updateBackupStatus(
    id: string,
    status: BackupStatus,
    errorMessage?: string,
    filePath?: string,
    size?: string,
  ): Promise<void> {
    const updateData: Partial<Backup> = { status };

    if (errorMessage) {
      updateData.error_message = errorMessage;
    }

    if (filePath) {
      updateData.file_path = filePath;
    }

    if (size) {
      updateData.size = size;
    }

    await this.backupRepository.update({ id }, updateData);
  }

  async restoreBackup(
    id: string,
  ): Promise<{ success: boolean; message: string }> {
    const backup = await this.getBackup(id);

    if (backup.status !== BackupStatus.COMPLETED) {
      throw new Error(
        `Cannot restore from backup with status: ${backup.status}`,
      );
    }

    if (!backup.file_path || !fs.existsSync(backup.file_path)) {
      throw new Error(`Backup file not found at: ${backup.file_path}`);
    }

    try {
      await this.restoreMySQLBackup(backup.file_path);
      return { success: true, message: "Database restored successfully" };
    } catch (error) {
      console.error("Error restoring MySQL backup:", error);
      throw new Error(`Failed to restore database: ${error.message}`);
    }
  }

  private async restoreMySQLBackup(backupFilePath: string): Promise<void> {
    // Get database configuration from .env via ConfigService
    const dbHost = this.configService.get("DATABASE_HOST");
    const dbPort = this.configService.get("DATABASE_PORT");
    const dbUser = this.configService.get("DATABASE_USERNAME");
    const dbPassword = this.configService.get("DATABASE_PASSWORD");
    const dbName = this.configService.get("DATABASE_NAME");

    // Construct mysql command for restore
    let mysqlCommand: string;

    if (process.platform === "win32") {
      // Windows command
      mysqlCommand = `mysql --host=${dbHost} --port=${dbPort} --user=${dbUser} --password=${dbPassword} ${dbName} < "${backupFilePath}"`;
    } else {
      // Unix command
      mysqlCommand = `MYSQL_PWD="${dbPassword}" mysql --host=${dbHost} --port=${dbPort} --user=${dbUser} ${dbName} < "${backupFilePath}"`;
    }

    // Execute the restore command
    const exec = util.promisify(child_process.exec);
    await exec(mysqlCommand);

    console.log(`MySQL database restored from: ${backupFilePath}`);
  }

  async deleteBackup(
    id: string,
  ): Promise<{ success: boolean; message: string }> {
    const backup = await this.getBackup(id);

    // Delete the actual backup file if it exists
    if (backup.file_path && fs.existsSync(backup.file_path)) {
      try {
        fs.unlinkSync(backup.file_path);
      } catch (error) {
        console.error(
          `Failed to delete backup file at ${backup.file_path}:`,
          error,
        );
      }
    }

    // Soft delete the backup record
    await this.backupRepository.update({ id: backup.id }, { is_deleted: true });

    return { success: true, message: "Backup deleted successfully" };
  }

  async downloadBackup(id: string): Promise<any> {
    const backup = await this.getBackup(id);

    // Instead, check if the file exists and throw if not
    if (!backup.file_path || !fs.existsSync(backup.file_path)) {
      throw new NotFoundException(
        `Backup file not found for backup ID ${id} at path: ${backup.file_path || "N/A"}`,
      );
    }

    // Read the file content
    const fileContent = fs.readFileSync(backup.file_path);

    // Return the file info
    return {
      filename: path.basename(backup.file_path),
      content: fileContent,
    };
  }

  async restoreBackupFromFile(file: any): Promise<any> {
    this.logger.log(
      `Starting restore process from uploaded file: ${file.originalname}`,
    );

    const tempDir = path.join(os.tmpdir(), 'nsdo-backups');
    await fs.ensureDir(tempDir);
    // Use a more specific name for the temp file to avoid potential clashes if originalname is not unique enough
    const uniqueFilename = `${uuidv4()}-${file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const tempFilePath = path.join(tempDir, uniqueFilename);

    try {
      this.logger.log(`Saving uploaded file temporarily to: ${tempFilePath}`);
      await fs.writeFile(tempFilePath, file.buffer); // fs.writeFile from fs-extra
      this.logger.log(`File ${file.originalname} saved successfully to ${tempFilePath}`);

      let sqlContent: string;

      if (file.originalname.endsWith('.gz')) {
        this.logger.log(`Decompressing gzipped file: ${file.originalname}`);
        const fileBuffer = await fs.readFile(tempFilePath); // fs.readFile from fs-extra
        const decompressedBuffer = await new Promise<Buffer>((resolve, reject) => {
          zlib.gunzip(fileBuffer, (err, buffer) => {
            if (err) return reject(err);
            resolve(buffer);
          });
        });
        sqlContent = decompressedBuffer.toString('utf8');
        this.logger.log(`File ${file.originalname} decompressed successfully.`);
      } else if (file.originalname.endsWith('.sql')) {
        sqlContent = await fs.readFile(tempFilePath, "utf8"); // fs.readFile from fs-extra
        this.logger.log(`Read SQL content from ${file.originalname}`);
      } else {
        // Clean up before throwing error
        if (await fs.pathExists(tempFilePath)) {
          await fs.unlink(tempFilePath);
        }
        throw new Error(
          "Unsupported file type. Only .sql or .gz files are supported for direct restore.",
        );
      }

      if (!sqlContent || sqlContent.trim() === "") {
         // Clean up before throwing error
        if (await fs.pathExists(tempFilePath)) {
          await fs.unlink(tempFilePath);
        }
        throw new Error("SQL content is empty or invalid.");
      }

      this.logger.log(
        `Attempting to execute SQL commands from ${file.originalname}`,
      );

      // Use the pgp instance and connection options initialized in the constructor
      const db = this.pgp(this.dbConnectionOptions);

      await db.tx(async (t) => {
        this.logger.log("Executing SQL script within a transaction...");
        await t.none(sqlContent);
        this.logger.log(
          `SQL script from ${file.originalname} executed successfully.`, 
        );
      });

      this.logger.log(
        `Database restoration from file ${file.originalname} completed successfully.`,
      );
      return {
        message: `Database restored successfully from ${file.originalname}`,
        filename: file.originalname,
      };
    } catch (error) {
      this.logger.error(
        `Error during database restoration from file ${file.originalname}: ${error.message}`,
        error.stack,
      );
      throw new Error( // Re-throw with a clear message for the controller
        `Failed to restore database from ${file.originalname}. Reason: ${error.message}`,
      );
    } finally {
      try {
        if (await fs.pathExists(tempFilePath)) {
          await fs.unlink(tempFilePath); // fs.unlink from fs-extra
          this.logger.log(`Temporary file ${tempFilePath} deleted.`);
        }
      } catch (cleanupError) {
        this.logger.warn(
          `Failed to delete temporary file ${tempFilePath}: ${cleanupError.message}`,
        );
      }
    }
  }

  private generateBackupName(type: "full" | "partial"): string {
    const timestamp = new Date().toISOString().replace(/[.:T]/g, "-").slice(0, -5); // Format: YYYY-MM-DD-HH-MM-SS
    return `backup-${type}-${timestamp}`;
  }

  async onModuleInit() {
    this.logger.log("BackupService onModuleInit: Ensuring backup directory exists.");
    try {
      await fs.ensureDir(this.dbBackupDir);
      // Load existing backups metadata if needed, e.g., from files or database
      // this.loadBackupsFromDisk(); 
    } catch (error) {
      this.logger.error('Failed to ensure backup directory or load backups on init', error);
    }
  }
}
