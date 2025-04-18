import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Like, Repository } from 'typeorm';
import { ActivityLog } from '../entities/activity-log.entity';
import { User } from '../../users/entities/user.entity';
import { Request } from 'express';
import { Logger } from '@nestjs/common';

@Injectable()
export class ActivityLogService {
  private readonly logger = new Logger(ActivityLogService.name);

  constructor(
    @InjectRepository(ActivityLog)
    private activityLogRepository: Repository<ActivityLog>,
  ) {}

  /**
   * Create a new activity log entry
   */
  async createLog(logData: {
    user_id?: string;
    action: string;
    target: string;
    target_id?: string;
    details: string;
    ip_address?: string;
    status?: 'success' | 'warning' | 'error';
  }): Promise<ActivityLog> {
    this.logger.log(`[createLog] Creating log with data: ${JSON.stringify(logData)}`);

    const activityLog = this.activityLogRepository.create({
      user_id: logData.user_id,
      action: logData.action,
      target: logData.target,
      target_id: logData.target_id,
      details: logData.details,
      ip_address: logData.ip_address,
      status: logData.status || 'success',
    });

    try {
      const savedLog = await this.activityLogRepository.save(activityLog);
      this.logger.log(`[createLog] Log saved successfully with ID: ${savedLog.id}`);
      return savedLog;
    } catch (error) {
      this.logger.error(`[createLog] Failed to save activity log: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Log user activity from a request
   */
  async logFromRequest(
    req: Request,
    action: string,
    target: string,
    details: string,
    target_id?: string,
    status: 'success' | 'warning' | 'error' = 'success',
  ): Promise<ActivityLog> {
    const userContext = req.user as { userId?: string; username?: string; /* other fields */ };
    const userId = userContext?.userId; // Extract the userId
    const ip_address = req.ip || req.headers['x-forwarded-for'] as string || 'unknown';

    this.logger.log(`[logFromRequest] User context from req.user: ${JSON.stringify(userContext)}`);
    this.logger.log(`[logFromRequest] Extracted userId: ${userId}`);

    if (!userId) {
        this.logger.error(`[logFromRequest] Cannot log activity, userId is missing from request context!`);
        throw new Error('User ID missing from request context, cannot create activity log.');
    }

    // Pass only the userId string to createLog
    return this.createLog({
      user_id: userId, // Pass the extracted ID string
      action,
      target,
      target_id,
      details,
      ip_address,
      status,
    });
  }

  /**
   * Get activity logs with filtering and pagination
   */
  async getLogs(filters: {
    startDate?: Date;
    endDate?: Date;
    action?: string;
    target?: string;
    user_id?: string;
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ logs: ActivityLog[]; total: number; page: number; limit: number; totalPages: number }> {
    const {
      startDate,
      endDate,
      action,
      target,
      user_id,
      status,
      search,
      page = 0,
      limit = 10,
    } = filters;

    // Build where conditions
    let whereConditions: any = {};

    // Date range filter
    if (startDate && endDate) {
      whereConditions.timestamp = Between(startDate, endDate);
    }

    // Action filter
    if (action) {
      whereConditions.action = action;
    }

    // Target filter
    if (target) {
      whereConditions.target = target;
    }

    // User filter
    if (user_id) {
      whereConditions.user_id = user_id;
    }

    // Status filter
    if (status) {
      whereConditions.status = status;
    }

    // Search filter (search in details)
    if (search) {
      whereConditions.details = Like(`%${search}%`);
    }

    // Query with conditions and pagination
    const [logs, total] = await this.activityLogRepository.findAndCount({
      where: whereConditions,
      relations: ['user'],
      order: { timestamp: 'DESC' },
      skip: page * limit,
      take: limit,
    });

    return {
      logs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Clear all activity logs
   */
  async clearLogs(): Promise<{ success: boolean; message: string }> {
    await this.activityLogRepository.clear();
    return { success: true, message: 'All activity logs cleared successfully' };
  }
} 