import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository, Between } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Department } from '../departments/entities/department.entity';
import { Task, TaskStatus } from '../tasks/entities/task.entity';

// Mock activity log entity until we create a real one
class ActivityLog {
  id: string;
  user: string;
  action: string;
  target: string;
  details: string;
  timestamp: Date;
  status: 'success' | 'warning' | 'error';
}

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Department)
    private departmentsRepository: Repository<Department>,
    @InjectRepository(Task)
    private tasksRepository: Repository<Task>,
  ) {}

  async getDashboardStats() {
    // Get basic counts
    const users = await this.usersRepository.count();
    const departments = await this.departmentsRepository.count();
    const tasks = await this.tasksRepository.count();

    console.log('Dashboard stats - counts:', { users, departments, tasks });

    // Get department statistics with more details
    const departmentEntities = await this.departmentsRepository.find({
      relations: ['members', 'tasks', 'head'],
    });

    console.log('Dashboard stats - department entities:', departmentEntities.length);

    const departmentStats = departmentEntities.map(department => {
      const members_count = department.members ? department.members.length : 0;
      // Count unique projects (using departmentId as a proxy since we don't have a project field)
      const active_projects = 1; // Simplified for now
      
      const totalTasks = department.tasks ? department.tasks.length : 0;
      const completedTasks = department.tasks 
        ? department.tasks.filter(task => task.status === TaskStatus.DONE).length 
        : 0;
      
      const completion_rate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
      
      return {
        id: department.id,
        name: department.name,
        members_count,
        active_projects,
        completion_rate,
        head_name: department.head ? department.head.username : 'No Head'
      };
    });

    // Get recent activities (mock data for now)
    // In a real implementation, you would fetch this from an activity log table
    const recentActivities = this.generateMockActivities();

    // Get task statistics
    const pendingTasks = await this.tasksRepository.count({ where: { status: TaskStatus.TODO } });
    const inProgressTasks = await this.tasksRepository.count({ where: { status: TaskStatus.IN_PROGRESS } });
    const completedTasks = await this.tasksRepository.count({ where: { status: TaskStatus.DONE } });

    // Get user statistics
    const activeUsers = await this.usersRepository.count({ where: { isActive: true } });
    const inactiveUsers = await this.usersRepository.count({ where: { isActive: false } });
    
    // Get tasks due soon (next 7 days)
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);
    
    const upcomingTasks = await this.tasksRepository.count({
      where: {
        dueDate: Between(today, nextWeek),
        status: TaskStatus.TODO
      }
    });

    const result = {
      stats: {
        users,
        departments,
        tasks,
        activeUsers,
        inactiveUsers,
        pendingTasks,
        inProgressTasks,
        completedTasks,
        upcomingTasks
      },
      department_stats: departmentStats,
      recent_activities: recentActivities
    };

    console.log('Dashboard stats - result:', JSON.stringify(result, null, 2));

    // Return comprehensive dashboard data
    return result;
  }

  // Helper method to generate mock activity data
  private generateMockActivities(): ActivityLog[] {
    const actions = ['created', 'updated', 'deleted', 'assigned', 'completed'];
    const targets = ['task', 'department', 'user', 'project'];
    const users = ['John Doe', 'Jane Smith', 'Mike Johnson', 'Sarah Williams', 'David Brown'];
    const statuses = ['success', 'warning', 'error'];
    
    return Array(5).fill(0).map((_, index) => {
      const action = actions[Math.floor(Math.random() * actions.length)];
      const target = targets[Math.floor(Math.random() * targets.length)];
      const user = users[Math.floor(Math.random() * users.length)];
      const status = statuses[Math.floor(Math.random() * statuses.length)] as 'success' | 'warning' | 'error';
      
      // Create timestamp with decreasing recency
      const timestamp = new Date();
      timestamp.setHours(timestamp.getHours() - index * 2);
      
      return {
        id: `activity-${index + 1}`,
        user,
        action,
        target,
        details: `${user} ${action} a ${target}`,
        timestamp,
        status
      };
    });
  }

  async getAllUsers(search?: string) {
    if (search) {
      return this.usersRepository.find({
        where: [
          { username: Like(`%${search}%`) },
          { email: Like(`%${search}%`) },
        ],
      });
    }
    return this.usersRepository.find();
  }

  async getAllDepartments(search?: string) {
    if (search) {
      return this.departmentsRepository.find({
        where: [
          { name: Like(`%${search}%`) },
          { description: Like(`%${search}%`) },
        ],
        relations: ['head', 'members'],
      });
    }
    return this.departmentsRepository.find({ relations: ['head', 'members'] });
  }

  async getAllTasks(search?: string) {
    if (search) {
      return this.tasksRepository.find({
        where: [
          { title: Like(`%${search}%`) },
          { description: Like(`%${search}%`) },
        ],
        relations: ['createdBy', 'department', 'assignedTo'],
      });
    }
    return this.tasksRepository.find({ relations: ['createdBy', 'department', 'assignedTo'] });
  }

  async getActivityLogs(filters: any) {
    // Mock implementation - in a real app, you would query a logs table
    return this.generateMockActivities();
  }

  async clearAllLogs() {
    // Mock implementation - in a real app, you would clear the logs table
    return { success: true, message: 'All logs cleared successfully' };
  }

  async getSystemSettings() {
    // Mock implementation - in a real app, you would fetch from a settings table
    return {
      security: {
        two_factor_enabled: true,
        password_expiry_days: 90,
        max_login_attempts: 5,
        lockout_duration_minutes: 30,
        password_complexity_required: true,
        session_timeout_minutes: 60,
      },
      backup: {
        auto_backup_enabled: true,
        backup_frequency_hours: 24,
        backup_retention_days: 30,
        backup_location: '/backups',
      },
      notifications: {
        email_notifications_enabled: true,
        smtp_server: 'smtp.example.com',
        smtp_port: 587,
        smtp_username: 'notifications@example.com',
        smtp_password: '********',
        smtp_use_tls: true,
      },
      api: {
        api_enabled: true,
        api_key: 'sk_test_abcdefghijklmnopqrstuvwxyz',
        weather_api_enabled: true,
        weather_api_key: '',
        api_rate_limit: 100,
        api_allowed_ips: '',
      },
    };
  }

  async updateSystemSettings(settings: any) {
    // Mock implementation - in a real app, you would update the settings table
    console.log('Updating system settings:', settings);
    return { success: true, message: 'Settings updated successfully' };
  }

  async createBackup(backupOptions: { type: 'full' | 'partial', location?: string }) {
    // Mock implementation - in a real app, you would create an actual backup
    console.log('Creating backup with options:', backupOptions);
    const backupId = `backup_${Date.now()}`;
    return { 
      success: true, 
      message: 'Backup created successfully', 
      id: backupId 
    };
  }

  async restoreBackup(backupId: string) {
    // Mock implementation - in a real app, you would restore from a backup
    console.log('Restoring from backup:', backupId);
    return { success: true, message: 'System restored successfully' };
  }

  async getBackups() {
    // Mock implementation - in a real app, you would fetch from a backups table
    return [
      {
        id: 'backup_1',
        name: 'Daily Backup',
        timestamp: new Date().toISOString(),
        size: '256 MB',
        type: 'full',
        status: 'completed',
        created_by: 'system',
        notes: 'Automated daily backup',
      },
      {
        id: 'backup_2',
        name: 'Weekly Backup',
        timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        size: '512 MB',
        type: 'full',
        status: 'completed',
        created_by: 'admin',
        notes: 'Manual weekly backup',
      },
    ];
  }

  async deleteBackup(backupId: string) {
    // Mock implementation - in a real app, you would delete from a backups table
    console.log('Deleting backup:', backupId);
    return { success: true, message: 'Backup deleted successfully' };
  }

  async getSystemHealth() {
    try {
      // Get database status
      const dbStatus = {
        connected: true,
        tables: {
          users: await this.usersRepository.count(),
          departments: await this.departmentsRepository.count(),
          tasks: await this.tasksRepository.count()
        }
      };

      // Get system resources
      const memoryUsage = process.memoryUsage();
      const systemInfo = {
        uptime: process.uptime(),
        memory: {
          total: Math.round(memoryUsage.heapTotal / 1024 / 1024),
          used: Math.round(memoryUsage.heapUsed / 1024 / 1024),
          rss: Math.round(memoryUsage.rss / 1024 / 1024),
          external: Math.round((memoryUsage.external || 0) / 1024 / 1024)
        },
        node: {
          version: process.version,
          platform: process.platform,
          arch: process.arch
        }
      };

      // Get recent errors (mock for now)
      const recentErrors = [];
      
      // Get API endpoints status
      const apiEndpoints = [
        { name: 'Authentication', path: '/api/auth', status: 'operational' },
        { name: 'Tasks', path: '/api/tasks', status: 'operational' },
        { name: 'Departments', path: '/api/departments', status: 'operational' },
        { name: 'Users', path: '/api/users', status: 'operational' },
        { name: 'Admin', path: '/api/admin', status: 'operational' }
      ];

      return {
        timestamp: new Date().toISOString(),
        status: 'operational',
        database: dbStatus,
        system: systemInfo,
        api: {
          endpoints: apiEndpoints,
          errors: recentErrors
        },
        environment: {
          nodeEnv: process.env.NODE_ENV || 'development',
          port: process.env.PORT || 3001,
          dbType: process.env.DB_TYPE || 'mysql'
        }
      };
    } catch (error) {
      return {
        timestamp: new Date().toISOString(),
        status: 'error',
        message: error.message,
        error: error.stack
      };
    }
  }
} 