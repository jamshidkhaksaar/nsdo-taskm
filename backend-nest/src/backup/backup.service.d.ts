import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { BackupOptionsDto } from './dto/backup-options.dto';
import { Backup, BackupStatus } from './entities/backup.entity';

export declare class BackupService {
  private readonly backupRepository: Repository<Backup>;
  private readonly configService: ConfigService;
  
  constructor(
    backupRepository: Repository<Backup>,
    configService: ConfigService,
  );
  
  private initializeDefaultBackups(): Promise<void>;
  getBackups(): Promise<Backup[]>;
  getBackup(id: string): Promise<Backup>;
  createBackup(options: BackupOptionsDto): Promise<Backup>;
  private performMySQLBackup(backupId: string, backupDir: string, options: BackupOptionsDto): Promise<void>;
  private updateBackupStatus(id: string, status: BackupStatus, errorMessage?: string, filePath?: string, size?: string): Promise<void>;
  restoreBackup(id: string): Promise<{ success: boolean; message: string }>;
  private restoreMySQLBackup(backupFilePath: string): Promise<void>;
  deleteBackup(id: string): Promise<{ success: boolean; message: string }>;
  downloadBackup(id: string): Promise<any>;
} 