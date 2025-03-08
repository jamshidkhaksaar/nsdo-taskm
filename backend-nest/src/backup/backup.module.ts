import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { BackupController } from './backup.controller';
import { BackupService } from './backup.service';
import { Backup } from './entities/backup.entity';

/**
 * Module for handling backup and restore operations
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Backup]),
    ConfigModule,
  ],
  controllers: [BackupController],
  providers: [
    BackupService,
  ],
  exports: [BackupService],
})
export class BackupModule {} 