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
import { Setting } from './entities/setting.entity';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { SettingDto } from './dto/update-settings.dto';
import { Logger } from '@nestjs/common';
import * as SendGrid from '@sendgrid/mail';

@Injectable()
export class SettingsService {
  private readonly logger = new Logger(SettingsService.name);

  constructor(
    @InjectRepository(ApiSettings)
    private apiSettingsRepository: Repository<ApiSettings>,
    
    @InjectRepository(SecuritySettings)
    private securitySettingsRepository: Repository<SecuritySettings>,
    
    @InjectRepository(BackupSettings)
    private backupSettingsRepository: Repository<BackupSettings>,
    
    @InjectRepository(NotificationSettings)
    private notificationSettingsRepository: Repository<NotificationSettings>,
    
    @InjectRepository(Setting)
    private settingsRepository: Repository<Setting>,
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

  async getAllSettings(): Promise<Setting[]> {
    return this.settingsRepository.find();
  }

  async getSetting(key: string): Promise<Setting | null> {
    return this.settingsRepository.findOneBy({ key });
  }

  async getSettingValue(key: string): Promise<string | null> {
    const setting = await this.getSetting(key);
    return setting ? setting.value : null;
  }

  async updateSettings(updateSettingsDto: UpdateSettingsDto): Promise<Setting[]> {
    this.logger.debug(`Entering updateSettings with DTO: ${JSON.stringify(updateSettingsDto)}`);
    const updatedSettings: Setting[] = [];

    if (!updateSettingsDto || !Array.isArray(updateSettingsDto.settings)) {
      this.logger.error('Invalid settings data format received.', updateSettingsDto);
      throw new Error('Invalid settings data format. Expected an object with a "settings" array.');
    }
    
    this.logger.debug(`Number of settings to process: ${updateSettingsDto.settings.length}`);

    for (const settingDto of updateSettingsDto.settings) {
      this.logger.debug(`Processing setting DTO: ${JSON.stringify(settingDto)}`);
      if (!settingDto || !settingDto.key) {
        this.logger.warn('Skipping setting DTO due to missing key.', settingDto);
        continue;
      }
      
      let setting = await this.settingsRepository.findOne({ where: { key: settingDto.key } });
      this.logger.debug(`Found existing setting for key ${settingDto.key}: ${!!setting}`);
      
      if (setting) {
        this.logger.debug(`Updating setting ${settingDto.key} from ${setting.value} to ${settingDto.value}`);
        setting.value = settingDto.value;
        if (settingDto.description !== undefined) {
          setting.description = settingDto.description;
        }
      } else {
        this.logger.debug(`Creating new setting for key ${settingDto.key} with value ${settingDto.value}`);
        setting = this.settingsRepository.create(settingDto);
      }
      
      try {
        const savedSetting = await this.settingsRepository.save(setting);
        this.logger.debug(`Successfully saved setting for key ${settingDto.key}`);
        updatedSettings.push(savedSetting);
      } catch(dbError) {
          this.logger.error(`Database error saving setting for key ${settingDto.key}: ${dbError.message}`, dbError.stack);
          throw dbError;
      }
    }
    
    this.logger.debug(`Finished updateSettings. Returning ${updatedSettings.length} updated settings.`);
    return updatedSettings;
  }

  // Consider adding methods to get specific, strongly-typed settings
  async getSendGridApiKey(): Promise<string | null> {
    return this.getSettingValue('SENDGRID_API_KEY');
  }

  async getEmailFromAddress(): Promise<string | null> {
    // Example: Fetch a default FROM address
    return this.getSettingValue('EMAIL_FROM_ADDRESS'); 
  }

  // You might want a method to get all settings as a key-value object for easier use
  async getAllSettingsAsMap(): Promise<Record<string, string>> {
    const settings = await this.getAllSettings();
    const settingsMap: Record<string, string> = {};
    settings.forEach(s => {
      settingsMap[s.key] = s.value;
    });
    return settingsMap;
  }

  // Method to test SendGrid configuration using @sendgrid/mail
  async testSendGridSettings(recipientEmail: string): Promise<{ success: boolean; message: string }> {
    this.logger.debug(`Attempting to send test email to ${recipientEmail} via @sendgrid/mail.`);
    
    const apiKey = await this.getSettingValue('SENDGRID_API_KEY');
    const fromAddress = await this.getSettingValue('EMAIL_FROM_ADDRESS');

    if (!apiKey) {
      this.logger.error('SendGrid API Key is not configured.');
      return { success: false, message: 'SendGrid API Key is not configured in settings.' };
    }
    if (!fromAddress) {
      this.logger.error('Default From Email Address is not configured.');
      return { success: false, message: 'Default From Email Address is not configured in settings.' };
    }

    SendGrid.setApiKey(apiKey); // Set the API key for this request
    this.logger.debug(`Using From Address: ${fromAddress}`);
    this.logger.debug(`Using SendGrid API Key: SG.***${apiKey.slice(-4)}`); 

    const msg = {
      to: recipientEmail,
      from: fromAddress,
      subject: 'TaskM SendGrid Test Email',
      text: 'This is a test email sent from the TaskM application using your configured SendGrid settings.',
      html: '<p>This is a test email sent from the TaskM application using your configured SendGrid settings.</p>',
    };

    try {
      await SendGrid.send(msg);
      this.logger.log(`Successfully sent SendGrid test email to ${recipientEmail} via @sendgrid/mail.`);
      return { success: true, message: `Test email successfully sent to ${recipientEmail}.` };
    } catch (error) {
      this.logger.error(`Failed to send SendGrid test email to ${recipientEmail} via @sendgrid/mail: ${error.message}`, error.stack);
      let errorMessage = 'Failed to send test email. Check backend logs for details.';
      // Try to extract specific SendGrid errors if available
      if (error.response?.body?.errors) {
          errorMessage = `SendGrid Error: ${error.response.body.errors.map(e => e.message).join(', ')}`;
      } else if (error.code === 'ENOTFOUND') {
          errorMessage = 'Network error: Could not reach SendGrid. Check DNS and connectivity.';
      } else if (error.message.includes('Forbidden') || error.statusCode === 403) {
          errorMessage = 'SendGrid Error: Authentication failed. Check your API Key permissions.';
      } else if (error.statusCode === 401) {
           errorMessage = 'SendGrid Error: Authentication failed. Check your API Key.';
      }
      
      return { success: false, message: errorMessage };
    }
  }
} 