import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApiSettings } from './entities/api-settings.entity';
import { UpdateApiSettingsDto } from './dto/update-api-settings.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(ApiSettings)
    private apiSettingsRepository: Repository<ApiSettings>,
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

  // Helper method to generate a random API key
  private generateRandomApiKey(): string {
    return `key_${uuidv4().replace(/-/g, '')}`;
  }
} 