import { Controller, Get, Patch, Post, Body, Param, UseGuards } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { UpdateApiSettingsDto } from './dto/update-api-settings.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Settings')
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  // API Settings endpoints
  @Get('api-settings/:id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get API settings' })
  @ApiResponse({ status: 200, description: 'Return API settings' })
  async getApiSettings(@Param('id') id: string) {
    return this.settingsService.getApiSettings(+id);
  }

  @Patch('api-settings/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update API settings' })
  @ApiResponse({ status: 200, description: 'API settings updated successfully' })
  async updateApiSettings(
    @Param('id') id: string,
    @Body() updateApiSettingsDto: UpdateApiSettingsDto,
  ) {
    return this.settingsService.updateApiSettings(+id, updateApiSettingsDto);
  }

  @Post('api-settings/generate-key')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Generate new API key' })
  @ApiResponse({ status: 200, description: 'New API key generated successfully' })
  async generateApiKey() {
    return this.settingsService.generateApiKey();
  }
} 