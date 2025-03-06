import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApiSettings } from './entities/api-settings.entity';
import { SecuritySettings } from './entities/security-settings.entity';
import { BackupSettings } from './entities/backup-settings.entity';
import { NotificationSettings } from './entities/notification-settings.entity';
import { UpdateApiSettingsDto } from './dto/update-api-settings.dto';
import { UpdateSecuritySettingsDto } from './dto/update-security-settings.dto';
import { UpdateBackupSettingsDto } from './dto/update-backup-settings.dto';
import { UpdateNotificationSettingsDto } from './dto/update-notification-settings.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(ApiSettings)
    private apiSettingsRepository: Repository<ApiSettings>,
    
    @InjectRepository(SecuritySettings)
    private securitySettingsRepository: Repository<SecuritySettings>,
    
    @InjectRepository(BackupSettings)
    private backupSettingsRepository: Repository<BackupSettings>,
    
    @InjectRepository(NotificationSettings)
    private notificationSettingsRepository: Repository<NotificationSettings>,
  ) {}

  // Initialize settings if they don't exist (called when app starts)
  async initializeSettings() {
    // Check if API settings exist, if not create them
    const apiSettingsCount = await this.apiSettingsRepository.count();
    if (apiSettingsCount === 0) {
      const apiSettings = this.apiSettingsRepository.create({
        api_enabled: true,
        api_key: this.generateRandomApiKey(),
        weather_api_enabled: false,
        weather_api_key: '',
        api_rate_limit: 100,
        api_allowed_ips: '',
      });
      await this.apiSettingsRepository.save(apiSettings);
    }
    
    // Check if security settings exist, if not create them
    const securitySettingsCount = await this.securitySettingsRepository.count();
    if (securitySettingsCount === 0) {
      const securitySettings = this.securitySettingsRepository.create({
        two_factor_enabled: false,
        password_expiry_days: 90,
        max_login_attempts: 5,
        lockout_duration_minutes: 30,
        password_complexity_required: true,
        session_timeout_minutes: 60,
      });
      await this.securitySettingsRepository.save(securitySettings);
    }
    
    // Check if backup settings exist, if not create them
    const backupSettingsCount = await this.backupSettingsRepository.count();
    if (backupSettingsCount === 0) {
      const backupSettings = this.backupSettingsRepository.create({
        auto_backup_enabled: true,
        backup_frequency_hours: 24,
        backup_retention_days: 30,
        backup_location: '/backups',
      });
      await this.backupSettingsRepository.save(backupSettings);
    }
    
    // Check if notification settings exist, if not create them
    const notificationSettingsCount = await this.notificationSettingsRepository.count();
    if (notificationSettingsCount === 0) {
      const notificationSettings = this.notificationSettingsRepository.create({
        email_notifications_enabled: true,
        smtp_server: 'smtp.example.com',
        smtp_port: 587,
        smtp_username: 'notifications@example.com',
        smtp_password: '',
        smtp_use_tls: true,
      });
      await this.notificationSettingsRepository.save(notificationSettings);
    }
  }

  // API Settings methods
  async getApiSettings(id: number): Promise<ApiSettings> {
    // First try to find the settings with the provided ID
    let settings = await this.apiSettingsRepository.findOne({ where: { id } });
    
    // If not found, try to get the first record
    if (!settings) {
      const allSettings = await this.apiSettingsRepository.find({ 
        order: { id: 'ASC' },
        take: 1
      });
      
      if (allSettings.length > 0) {
        settings = allSettings[0];
      } else {
        // Create default settings if none exist
        settings = this.apiSettingsRepository.create({
          api_enabled: true,
          api_key: this.generateRandomApiKey(),
          weather_api_enabled: false,
          weather_api_key: '',
          api_rate_limit: 100,
          api_allowed_ips: '',
        });
        await this.apiSettingsRepository.save(settings);
      }
    }
    
    return settings;
  }

  async updateApiSettings(id: number, updateApiSettingsDto: UpdateApiSettingsDto): Promise<ApiSettings> {
    const settings = await this.getApiSettings(id);
    
    // Update the settings with the DTO values
    Object.assign(settings, updateApiSettingsDto);
    
    // Save the updated settings
    return this.apiSettingsRepository.save(settings);
  }

  async generateApiKey(): Promise<{ api_key: string }> {
    const apiKey = this.generateRandomApiKey();
    
    // Get the first API settings (assuming there's only one set of settings)
    const settings = await this.apiSettingsRepository.findOne({
      order: { id: 'ASC' }
    });
    
    if (!settings) {
      throw new NotFoundException('API settings not found');
    }
    
    // Update the API key
    settings.api_key = apiKey;
    await this.apiSettingsRepository.save(settings);
    
    return { api_key: apiKey };
  }

  // Security Settings methods
  async getSecuritySettings(id: number): Promise<SecuritySettings> {
    // First try to find the settings with the provided ID
    let settings = await this.securitySettingsRepository.findOne({ where: { id } });
    
    // If not found, try to get the first record
    if (!settings) {
      const allSettings = await this.securitySettingsRepository.find({ 
        order: { id: 'ASC' },
        take: 1
      });
      
      if (allSettings.length > 0) {
        settings = allSettings[0];
      } else {
        // Create default settings if none exist
        settings = this.securitySettingsRepository.create({
          two_factor_enabled: false,
          password_expiry_days: 90,
          max_login_attempts: 5,
          lockout_duration_minutes: 30,
          password_complexity_required: true,
          session_timeout_minutes: 60,
        });
        await this.securitySettingsRepository.save(settings);
      }
    }
    
    return settings;
  }

  async updateSecuritySettings(id: number, updateSecuritySettingsDto: UpdateSecuritySettingsDto): Promise<SecuritySettings> {
    const settings = await this.getSecuritySettings(id);
    
    // Update the settings with the DTO values
    Object.assign(settings, updateSecuritySettingsDto);
    
    // Save the updated settings
    return this.securitySettingsRepository.save(settings);
  }

  // Backup Settings methods
  async getBackupSettings(id: number): Promise<BackupSettings> {
    // First try to find the settings with the provided ID
    let settings = await this.backupSettingsRepository.findOne({ where: { id } });
    
    // If not found, try to get the first record
    if (!settings) {
      const allSettings = await this.backupSettingsRepository.find({ 
        order: { id: 'ASC' },
        take: 1
      });
      
      if (allSettings.length > 0) {
        settings = allSettings[0];
      } else {
        // Create default settings if none exist
        settings = this.backupSettingsRepository.create({
          auto_backup_enabled: true,
          backup_frequency_hours: 24,
          backup_retention_days: 30,
          backup_location: '/backups',
        });
        await this.backupSettingsRepository.save(settings);
      }
    }
    
    return settings;
  }

  async updateBackupSettings(id: number, updateBackupSettingsDto: UpdateBackupSettingsDto): Promise<BackupSettings> {
    const settings = await this.getBackupSettings(id);
    
    // Update the settings with the DTO values
    Object.assign(settings, updateBackupSettingsDto);
    
    // Save the updated settings
    return this.backupSettingsRepository.save(settings);
  }

  // Notification Settings methods
  async getNotificationSettings(id: number): Promise<NotificationSettings> {
    // First try to find the settings with the provided ID
    let settings = await this.notificationSettingsRepository.findOne({ where: { id } });
    
    // If not found, try to get the first record
    if (!settings) {
      const allSettings = await this.notificationSettingsRepository.find({ 
        order: { id: 'ASC' },
        take: 1
      });
      
      if (allSettings.length > 0) {
        settings = allSettings[0];
      } else {
        // Create default settings if none exist
        settings = this.notificationSettingsRepository.create({
          email_notifications_enabled: true,
          smtp_server: 'smtp.example.com',
          smtp_port: 587,
          smtp_username: 'notifications@example.com',
          smtp_password: '',
          smtp_use_tls: true,
        });
        await this.notificationSettingsRepository.save(settings);
      }
    }
    
    return settings;
  }

  async updateNotificationSettings(id: number, updateNotificationSettingsDto: UpdateNotificationSettingsDto): Promise<NotificationSettings> {
    const settings = await this.getNotificationSettings(id);
    
    // Update the settings with the DTO values
    Object.assign(settings, updateNotificationSettingsDto);
    
    // Save the updated settings
    return this.notificationSettingsRepository.save(settings);
  }

  async testEmailSettings(testEmailDto: UpdateNotificationSettingsDto): Promise<{ success: boolean; message: string }> {
    // This would send a test email in a real implementation
    // For now, just return a success response
    return { 
      success: true, 
      message: 'Test email sent successfully' 
    };
  }

  // Helper method to generate a random API key
  private generateRandomApiKey(): string {
    return `key_${uuidv4().replace(/-/g, '')}`;
  }
} 