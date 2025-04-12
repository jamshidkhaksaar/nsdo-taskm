import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, LessThan, Between, FindOperator } from 'typeorm';
import { Task, TaskStatus, TaskPriority } from '../tasks/entities/task.entity';
import { User } from '../users/entities/user.entity';
import { Department } from '../departments/entities/department.entity';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Department)
    private departmentRepository: Repository<Department>,
  ) {}

  async getProductivityMetrics(userId: number) {
    const now = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(now.getDate() - 30);

    // Get tasks completed by day for the last 30 days
    const completedTasks = await this.taskRepository
      .createQueryBuilder('task')
      .leftJoin('task.assignedToUsers', 'user')
      .where('user.id = :userId', { userId })
      .andWhere('task.status = :status', { status: TaskStatus.COMPLETED })
      .andWhere('task.updatedAt >= :thirtyDaysAgo', { thirtyDaysAgo })
      .select('DATE(task.updatedAt) as date')
      .addSelect('COUNT(*) as count')
      .groupBy('date')
      .orderBy('date', 'ASC')
      .getRawMany();

    // Get current tasks by status
    const tasksByStatus = await this.taskRepository
      .createQueryBuilder('task')
      .leftJoin('task.assignedToUsers', 'user')
      .where('user.id = :userId', { userId })
      .select('task.status as status')
      .addSelect('COUNT(*) as count')
      .groupBy('status')
      .getRawMany();

    // Get on-time completion percentage
    const completedOnTimeQuery = this.taskRepository
      .createQueryBuilder('task')
      .leftJoin('task.assignedToUsers', 'user')
      .where('user.id = :userId', { userId })
      .andWhere('task.status = :status', { status: TaskStatus.COMPLETED })
      .andWhere('task.updatedAt >= :thirtyDaysAgo', { thirtyDaysAgo })
      .andWhere('task.dueDate >= task.updatedAt');
    
    const completedTotalQuery = this.taskRepository
      .createQueryBuilder('task')
      .leftJoin('task.assignedToUsers', 'user')
      .where('user.id = :userId', { userId })
      .andWhere('task.status = :status', { status: TaskStatus.COMPLETED })
      .andWhere('task.updatedAt >= :thirtyDaysAgo', { thirtyDaysAgo });

    const [completedOnTime, totalCompleted] = await Promise.all([
      completedOnTimeQuery.getCount(),
      completedTotalQuery.getCount()
    ]);

    const onTimePercentage = totalCompleted > 0 
      ? (completedOnTime / totalCompleted) * 100 
      : 0;

    return {
      dailyCompletionTrend: completedTasks,
      tasksByStatus,
      onTimePercentage,
    };
  }

  async getCompletionRate(userId: number, period = 'weekly') {
    // Calculate date range based on period
    const now = new Date();
    const startDate = new Date();
    
    switch (period) {
      case 'daily':
        startDate.setDate(now.getDate() - 1);
        break;
      case 'weekly':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'monthly':
        startDate.setMonth(now.getMonth() - 1);
        break;
      default:
        startDate.setDate(now.getDate() - 7); // Default to weekly
    }

    // Get completed tasks count
    const completedCountQuery = this.taskRepository
      .createQueryBuilder('task')
      .leftJoin('task.assignedToUsers', 'user')
      .where('user.id = :userId', { userId })
      .andWhere('task.status = :status', { status: TaskStatus.COMPLETED })
      .andWhere('task.updatedAt BETWEEN :startDate AND :now', { startDate, now });

    // Get total tasks assigned in that period
    const totalCountQuery = this.taskRepository
      .createQueryBuilder('task')
      .leftJoin('task.assignedToUsers', 'user')
      .where('user.id = :userId', { userId })
      .andWhere('task.createdAt BETWEEN :startDate AND :now', { startDate, now });

    const [completedCount, totalCount] = await Promise.all([
      completedCountQuery.getCount(),
      totalCountQuery.getCount()
    ]);

    // Get tasks by priority
    const tasksByPriority = await this.taskRepository
      .createQueryBuilder('task')
      .leftJoin('task.assignedToUsers', 'user')
      .where('user.id = :userId', { userId })
      .andWhere('task.createdAt >= :startDate', { startDate })
      .select('task.priority as priority')
      .addSelect('COUNT(*) as count')
      .groupBy('priority')
      .getRawMany();

    // Calculate average time to complete tasks
    const completedTasks = await this.taskRepository
      .createQueryBuilder('task')
      .leftJoin('task.assignedToUsers', 'user')
      .where('user.id = :userId', { userId })
      .andWhere('task.status = :status', { status: TaskStatus.COMPLETED })
      .andWhere('task.updatedAt BETWEEN :startDate AND :now', { startDate, now })
      .getMany();

    let avgCompletionTime = 0;
    if (completedTasks.length > 0) {
      const totalTimeMs = completedTasks.reduce((total, task) => {
        const creationDate = task.createdAt ? new Date(task.createdAt).getTime() : 0;
        const completionDate = task.updatedAt ? new Date(task.updatedAt).getTime() : 0;
        const timeToComplete = completionDate - creationDate;
        return total + timeToComplete;
      }, 0);
      
      avgCompletionTime = totalTimeMs / completedTasks.length / (1000 * 60 * 60 * 24); // in days
    }

    return {
      period,
      completedCount,
      totalCount,
      completionRate: totalCount > 0 ? (completedCount / totalCount) * 100 : 0,
      tasksByPriority,
      avgCompletionTime,
    };
  }

  async getTaskDistribution(userId: number) {
    // Tasks by category/type
    const tasksByCategory = await this.taskRepository
      .createQueryBuilder('task')
      .leftJoin('task.assignedToUsers', 'user')
      .leftJoin('task.department', 'department')
      .where('user.id = :userId', { userId })
      .select('department.name as category')
      .addSelect('COUNT(*) as count')
      .groupBy('department.name')
      .getRawMany();

    // Tasks by due date (upcoming, overdue)
    const now = new Date();
    
    const upcomingTasks = await this.taskRepository
      .createQueryBuilder('task')
      .leftJoin('task.assignedToUsers', 'user')
      .where('user.id = :userId', { userId })
      .andWhere('task.status = :status', { status: TaskStatus.PENDING })
      .andWhere('task.dueDate > :now', { now })
      .getCount();

    const overdueTasks = await this.taskRepository
      .createQueryBuilder('task')
      .leftJoin('task.assignedToUsers', 'user')
      .where('user.id = :userId', { userId })
      .andWhere('task.status = :status', { status: TaskStatus.PENDING })
      .andWhere('task.dueDate < :now', { now })
      .getCount();

    // Task completion heatmap data (day of week + hour)
    const heatmapData = await this.taskRepository
      .createQueryBuilder('task')
      .leftJoin('task.assignedToUsers', 'user')
      .where('user.id = :userId', { userId })
      .andWhere('task.status = :status', { status: TaskStatus.COMPLETED })
      .andWhere('task.updatedAt IS NOT NULL')
      .select('DAYOFWEEK(task.updatedAt) as dayOfWeek')
      .addSelect('HOUR(task.updatedAt) as hour')
      .addSelect('COUNT(*) as count')
      .groupBy('dayOfWeek')
      .addGroupBy('hour')
      .getRawMany();

    return {
      tasksByCategory,
      upcomingTasks,
      overdueTasks,
      heatmapData,
    };
  }

  async getTaskRecommendations(userId: number) {
    const now = new Date();
    
    // High priority tasks approaching deadline
    const highPriorityTasks = await this.taskRepository
      .createQueryBuilder('task')
      .leftJoin('task.assignedToUsers', 'user')
      .where('user.id = :userId', { userId })
      .andWhere('task.status = :status', { status: TaskStatus.PENDING })
      .andWhere('task.priority = :priority', { priority: TaskPriority.HIGH })
      .orderBy('task.dueDate', 'ASC')
      .take(3)
      .getMany();

    // Overdue tasks
    const overdueTasks = await this.taskRepository
      .createQueryBuilder('task')
      .leftJoin('task.assignedToUsers', 'user')
      .where('user.id = :userId', { userId })
      .andWhere('task.status = :status', { status: TaskStatus.PENDING })
      .andWhere('task.dueDate < :now', { now })
      .orderBy('task.dueDate', 'ASC')
      .take(3)
      .getMany();

    // Tasks that should be started based on typical completion time
    const averageCompletionDays = await this.calculateAverageCompletionDays(userId);
    const dueDateThreshold = new Date();
    dueDateThreshold.setDate(now.getDate() + averageCompletionDays);

    const tasksToStart = await this.taskRepository
      .createQueryBuilder('task')
      .leftJoin('task.assignedToUsers', 'user')
      .where('user.id = :userId', { userId })
      .andWhere('task.status = :status', { status: TaskStatus.PENDING })
      .andWhere('task.dueDate BETWEEN :now AND :dueDateThreshold', { now, dueDateThreshold })
      .orderBy('task.dueDate', 'ASC')
      .take(3)
      .getMany();

    return {
      highPriorityTasks,
      overdueTasks,
      tasksToStart,
      averageCompletionDays,
    };
  }

  private async calculateAverageCompletionDays(userId: number): Promise<number> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const completedTasks = await this.taskRepository
      .createQueryBuilder('task')
      .leftJoin('task.assignedToUsers', 'user')
      .where('user.id = :userId', { userId })
      .andWhere('task.status = :status', { status: TaskStatus.COMPLETED })
      .andWhere('task.updatedAt > :thirtyDaysAgo', { thirtyDaysAgo })
      .getMany();

    if (completedTasks.length === 0) {
      return 3; // Default value if no data
    }

    const totalDays = completedTasks.reduce((total, task) => {
      const creationDate = task.createdAt ? new Date(task.createdAt).getTime() : 0;
      const completionDate = task.updatedAt ? new Date(task.updatedAt).getTime() : 0;
      const days = (completionDate - creationDate) / (1000 * 60 * 60 * 24);
      return total + days;
    }, 0);

    return Math.ceil(totalDays / completedTasks.length);
  }
}
