import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Like, Repository } from 'typeorm';
import { ActivityLog } from '../entities/activity-log.entity';
import { User } from '../../users/entities/user.entity';
import { Request } from 'express';

@Injectable()
export class ActivityLogService {
  constructor(
    @InjectRepository(ActivityLog)
    private activityLogRepository: Repository<ActivityLog>,
  ) {}

  /**
   * Create a new activity log entry
   */
  async createLog(logData: {
    user?: User;
    action: string;
    target: string;
    target_id?: string;
    details: string;
    ip_address?: string;
    status?: 'success' | 'warning' | 'error';
  }): Promise<ActivityLog> {
    const activityLog = this.activityLogRepository.create({
      user_id: logData.user?.id,
      user: logData.user,
      action: logData.action,
      target: logData.target,
      target_id: logData.target_id,
      details: logData.details,
      ip_address: logData.ip_address,
      status: logData.status || 'success',
    });

    return this.activityLogRepository.save(activityLog);
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
    const user = req.user as User;
    const ip_address = req.ip || req.headers['x-forwarded-for'] as string || 'unknown';

    return this.createLog({
      user,
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