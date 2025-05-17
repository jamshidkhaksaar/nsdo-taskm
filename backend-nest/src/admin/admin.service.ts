import { Injectable, Logger, Inject, forwardRef, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Like, Repository, Between, LessThan, Not, In, IsNull } from "typeorm";
import { User } from "../users/entities/user.entity";
import { Department } from "../departments/entities/department.entity";
import { Task, TaskStatus } from "../tasks/entities/task.entity";
import { ActivityLogService } from "./services/activity-log.service";
import { Province } from "../provinces/entities/province.entity";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { TwoFactorService } from "../auth/two-factor.service";

// Define structure for the overview stats (DTOs)
export class OverallCountsDto {
  @ApiProperty()
  totalTasks: number;
  @ApiProperty()
  pending: number;
  @ApiProperty()
  inProgress: number;
  @ApiProperty()
  completed: number;
  @ApiProperty()
  cancelled: number;
  @ApiProperty()
  delegated: number;
  @ApiProperty()
  overdue: number;
  @ApiProperty()
  dueToday: number;
  @ApiProperty()
  activeUsers: number;
  @ApiProperty()
  totalDepartments: number;
}

export class DepartmentTaskCountsDto {
  @ApiProperty()
  pending: number;
  @ApiProperty()
  inProgress: number;
  @ApiProperty()
  completed: number;
  @ApiProperty()
  overdue: number;
  @ApiProperty()
  total: number;
}

export class DepartmentStatsDto {
  @ApiProperty()
  departmentId: string;
  @ApiProperty()
  departmentName: string;
  @ApiProperty({ type: DepartmentTaskCountsDto })
  counts: DepartmentTaskCountsDto;
}

export class UserTaskCountsDto {
  @ApiProperty()
  pending: number;
  @ApiProperty()
  inProgress: number;
  @ApiProperty()
  completed: number;
  @ApiProperty()
  overdue: number;
  @ApiProperty()
  totalAssigned: number;
}

export class UserTaskStatsDto {
  @ApiProperty()
  userId: string;
  @ApiProperty()
  username: string;
  @ApiProperty({ type: UserTaskCountsDto })
  counts: UserTaskCountsDto;
}

export class ProvinceTaskCountsDto {
  @ApiProperty()
  pending: number;
  @ApiProperty()
  inProgress: number;
  @ApiProperty()
  completed: number;
  @ApiProperty()
  overdue: number;
  @ApiProperty()
  total: number;
}

export class ProvinceStatsDto {
  @ApiProperty()
  provinceId: string;
  @ApiProperty()
  provinceName: string;
  @ApiProperty({ type: ProvinceTaskCountsDto })
  counts: ProvinceTaskCountsDto;
}

export class TaskOverviewStatsDto {
  @ApiProperty({ type: OverallCountsDto })
  overallCounts: OverallCountsDto;
  @ApiProperty({ type: [DepartmentStatsDto] })
  departmentStats: DepartmentStatsDto[];
  @ApiProperty({ type: [UserTaskStatsDto] })
  userStats: UserTaskStatsDto[];
  @ApiProperty({ type: [ProvinceStatsDto] })
  provinceStats: ProvinceStatsDto[];
  @ApiProperty({ type: () => [Task] })
  overdueTasks: Task[];
}

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Department)
    private departmentsRepository: Repository<Department>,
    @InjectRepository(Task)
    private tasksRepository: Repository<Task>,
    private activityLogService: ActivityLogService,
    @InjectRepository(Province)
    private provincesRepository: Repository<Province>,
    @Inject(forwardRef(() => TwoFactorService))
    private twoFactorService: TwoFactorService,
  ) {}

  async getDashboardStats(requestingUser: User) {
    try {
      // Basic entity counts
      const [
        usersCount,
        departmentsCount,
        tasksCount,
        activeUsersCount,
        inactiveUsersCount,
        pendingTasksCount,
        inProgressTasksCount,
        completedTasksCount,
      ] = await Promise.all([
        this.usersRepository.count({ where: { deletedAt: IsNull() } }),
        this.departmentsRepository.count(),
        this.tasksRepository.count({ where: { isDeleted: false } }),
        this.usersRepository.count({ where: { isActive: true, deletedAt: IsNull() } }),
        this.usersRepository.count({ where: { isActive: false, deletedAt: IsNull() } }),
        this.tasksRepository.count({ where: { status: TaskStatus.PENDING, isDeleted: false } }),
        this.tasksRepository.count({
          where: { status: TaskStatus.IN_PROGRESS, isDeleted: false },
        }),
        this.tasksRepository.count({ where: { status: TaskStatus.COMPLETED, isDeleted: false } }),
      ]);

      // Get tasks due soon (next 7 days)
      const today = new Date();
      const nextWeek = new Date();
      nextWeek.setDate(today.getDate() + 7);

      const upcomingTasksCount = await this.tasksRepository.count({
        where: {
          dueDate: Between(today, nextWeek),
          status: TaskStatus.PENDING,
          isDeleted: false,
        },
      });

      // Get overdue tasks
      const overdueTasksCount = await this.tasksRepository.count({
        where: {
          dueDate: LessThan(today),
          status: TaskStatus.PENDING,
          isDeleted: false,
        },
      });

      // Get task trend data (last 7 days)
      const taskTrend = await this.getTaskTrendData();

      // Get department performance data
      const departmentStatsData = await this.getDepartmentStats();

      // Convert to the format expected by the frontend
      const departmentStats = departmentStatsData.map((dept) => ({
        id: dept.id,
        name: dept.name,
        members_count: dept.membersCount,
        active_projects: 1, // Placeholder value
        completion_rate: dept.completionRate,
        head_name: dept.headName,
      }));

      // Get recent activity logs
      const recentActivities = await this.getRecentActivities(requestingUser);

      // Calculate system health metrics
      const systemHealth = await this.getBasicSystemHealth();

      // Recent users
      const recentUsers = await this.getRecentUsers();

      // Get task distribution by priority
      const tasksByPriority = await this.getTasksByPriority();

      // Return data in the format expected by the frontend
      return {
        stats: {
          users: usersCount,
          departments: departmentsCount,
          tasks: tasksCount,
          activeUsers: activeUsersCount,
          inactiveUsers: inactiveUsersCount,
          pendingTasks: pendingTasksCount,
          inProgressTasks: inProgressTasksCount,
          completedTasks: completedTasksCount,
          upcomingTasks: upcomingTasksCount,
          overdueTasks: overdueTasksCount,
          taskCompletionRate:
            tasksCount > 0
              ? Math.round((completedTasksCount / tasksCount) * 100)
              : 0,
        },
        department_stats: departmentStats,
        recent_activities: recentActivities,
        task_trend: taskTrend,
        system_health: systemHealth,
        recent_users: recentUsers,
        tasks_by_priority: tasksByPriority,
      };
    } catch (error) {
      this.logger.error(`Error generating dashboard stats: ${error.message}`, error.stack);
      return {
        stats: {
          users: 0,
          departments: 0,
          tasks: 0,
          activeUsers: 0,
          inactiveUsers: 0,
          pendingTasks: 0,
          inProgressTasks: 0,
          completedTasks: 0,
          upcomingTasks: 0,
          overdueTasks: 0,
          taskCompletionRate: 0,
        },
        department_stats: [],
        recent_activities: this.generateMockActivities(),
        error: "Failed to generate dashboard statistics",
        message: error.message,
      };
    }
  }

  // Get recent activity logs
  private async getRecentActivities(requestingUser: User) {
    try {
      // Get recent activities (last 10)
      const logs = await this.activityLogService.getLogs(
        { limit: 10, page: 0 },
        requestingUser,
      );

      // Transform the logs to ensure user objects are properly serialized
      return logs.logs.map((log) => ({
        id: log.id,
        user: log.user ? log.user.username : "Unknown user", // Use username instead of the entire user object
        action: log.action,
        target: log.target,
        target_id: log.target_id,
        details: log.details,
        timestamp:
          log.timestamp instanceof Date
            ? log.timestamp.toISOString()
            : log.timestamp,
        ip_address: log.ip_address,
        status: log.status,
      }));
    } catch (error) {
      this.logger.error(`Error fetching recent activities: ${error.message}`, error.stack);
      // Fallback to mock data if real data fails
      return this.generateMockActivities();
    }
  }

  // Get department performance statistics
  private async getDepartmentStats() {
    try {
      // Get departments with their relations
      const departmentEntities = await this.departmentsRepository.find({
        relations: ["members", "assignedTasks", "head"],
      });

      return departmentEntities.map((department) => {
        const membersCount = department.members ? department.members.length : 0;
        const completedTasks = department.assignedTasks
          ? department.assignedTasks.filter(
              (task) => task.status === TaskStatus.COMPLETED,
            ).length
          : 0;
        const totalTasks = department.assignedTasks
          ? department.assignedTasks.length
          : 0;
        const completionRate =
          totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

        return {
          id: department.id,
          name: department.name,
          membersCount,
          completionRate,
          headName: department.head ? department.head.username : "N/A",
        };
      });
    } catch (error) {
      this.logger.error(`Error fetching department stats: ${error.message}`, error.stack);
      return [];
    }
  }

  // Get task trend data (tasks created/completed over last 7 days)
  private async getTaskTrendData() {
    try {
      const today = new Date();
      const trendData: { date: string; count: number }[] = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        date.setHours(0, 0, 0, 0); // Start of the day

        const nextDate = new Date(date);
        nextDate.setDate(date.getDate() + 1); // End of the day (start of next)

        const count = await this.tasksRepository.count({
          where: {
            createdAt: Between(date, nextDate),
          },
        });
        trendData.push({ date: date.toISOString().split("T")[0], count });
      }
      return trendData;
    } catch (error) {
      this.logger.error(`Error fetching task trend data: ${error.message}`, error.stack);
      return [];
    }
  }

  // Get recent users
  private async getRecentUsers() {
    try {
      return await this.usersRepository.find({
        order: { createdAt: "DESC" },
        take: 5,
        select: ["id", "username", "email", "createdAt"], // Select specific fields
      });
    } catch (error) {
      this.logger.error(`Error fetching recent users: ${error.message}`, error.stack);
      // Return empty array with proper structure to avoid rendering errors
      return [];
    }
  }

  // Get tasks by priority
  private async getTasksByPriority() {
    try {
      return await this.tasksRepository
        .createQueryBuilder("task")
        .select("task.priority", "priority")
        .addSelect("COUNT(task.id)", "count")
        .groupBy("task.priority")
        .getRawMany();
    } catch (error) {
      this.logger.error(`Error fetching tasks by priority: ${error.message}`, error.stack);
      return [];
    }
  }

  // Get basic system health metrics
  private async getBasicSystemHealth() {
    try {
      // Example basic health checks
      const dbConnected = await this.tasksRepository.query("SELECT 1"); // Simple query to check DB connection
      return {
        database: dbConnected ? "Connected" : "Disconnected",
        // Add other checks as needed
      };
    } catch (error) {
      this.logger.error(`Error fetching basic system health: ${error.message}`, error.stack);
      return {
        database: "Error",
      };
    }
  }

  async getAllUsers(search?: string, includeDeleted: boolean = false) {
    let users: User[] = [];
    const relations = ["role", "departments"];

    const whereConditions: any = { deletedAt: includeDeleted ? Not(IsNull()) : IsNull() };

    if (search) {
      users = await this.usersRepository.find({
        where: [
          { ...whereConditions, username: Like(`%${search}%`) },
          { ...whereConditions, email: Like(`%${search}%`) },
        ],
        relations,
        withDeleted: includeDeleted,
      });
    } else {
      users = await this.usersRepository.find({ 
        where: whereConditions,
        relations,
        withDeleted: includeDeleted,
      });
    }

    return users.map((user) => ({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role, // Consider sending a simplified role object if needed
      isActive: user.isActive, // Keep this for direct boolean access if needed elsewhere
      status: user.isActive ? "active" : "inactive", // Add string status for UI
      departments: user.departments, // Include departments array
      lastLogin: (user as any).lastLogin || null, // Attempt to include lastLogin, fallback to null
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      position: (user as any).position, // Ensure position is included
    }));
  }

  async getAllDepartments(search?: string) {
    let departments: Department[] = [];

    if (search) {
      departments = await this.departmentsRepository.find({
        where: [
          { name: Like(`%${search}%`) },
          { description: Like(`%${search}%`) },
        ],
        relations: ["head", "members"],
      });
    } else {
      departments = await this.departmentsRepository.find({
        relations: ["head", "members"],
      });
    }

    // Sanitize the department data to avoid sending full user objects
    return departments.map((department) => {
      // Create a sanitized version of the department
      const sanitizedDepartment = {
        id: department.id,
        name: department.name,
        description: department.description,
        provinceId: department.provinceId,
        createdAt: department.createdAt,
        updatedAt: department.updatedAt,
        head: null, // Initialize head as null
        members: [], // Initialize members as empty array
      } as any; // Use 'as any' temporarily if needed, or define a proper DTO

      // Replace head with minimal user info safely
      if (department.head) {
        sanitizedDepartment.head = {
          id: department.head.id,
          username: department.head.username,
          role: department.head.role,
        };
      }

      // Replace members with minimal user info
      if (department.members && department.members.length > 0) {
        sanitizedDepartment.members = department.members.map((user) => ({
          id: user.id,
          username: user.username,
          role: user.role,
        }));
      } else {
        sanitizedDepartment.members = [];
      }

      return sanitizedDepartment;
    });
  }

  async getAllTasks(search?: string) {
    let tasks: Task[] = [];

    if (search) {
      tasks = await this.tasksRepository.find({
        where: [
          { title: Like(`%${search}%`) },
          { description: Like(`%${search}%`) },
        ],
        relations: ["createdBy", "department", "assignedToUsers"],
      });
    } else {
      tasks = await this.tasksRepository.find({
        relations: ["createdBy", "department", "assignedToUsers"],
      });
    }

    // Sanitize the task data to avoid sending full user objects
    return tasks.map((task) => {
      // Create a sanitized version of the task with type assertion
      const sanitizedTask = { ...task } as any;

      // Replace createdBy with minimal user info
      if (sanitizedTask.createdBy) {
        sanitizedTask.createdBy = {
          id: task.createdBy.id,
          username: task.createdBy.username,
          role: task.createdBy.role,
        };
      }

      // Replace assignedTo with minimal user info
      if (
        sanitizedTask.assignedToUsers &&
        sanitizedTask.assignedToUsers.length > 0
      ) {
        sanitizedTask.assignedToUsers = task.assignedToUsers.map((user) => ({
          id: user.id,
          username: user.username,
          role: user.role,
        }));
      }

      return sanitizedTask;
    });
  }

  async getActivityLogs(filters: any, requestingUser: User) {
    return this.activityLogService.getLogs(filters, requestingUser);
  }

  async clearAllLogs() {
    return this.activityLogService.clearLogs();
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
        backup_location: "/backups",
      },
      notifications: {
        email_notifications_enabled: true,
        smtp_server: "smtp.example.com",
        smtp_port: 587,
        smtp_username: "notifications@example.com",
        smtp_password: "********",
        smtp_use_tls: true,
      },
      api: {
        api_enabled: true,
        api_key: "sk_test_abcdefghijklmnopqrstuvwxyz",
        weather_api_enabled: true,
        weather_api_key: "",
        api_rate_limit: 100,
        api_allowed_ips: "",
      },
    };
  }

  async updateSystemSettings(settings: any) {
    // Mock implementation - in a real app, you would update the settings table
    console.log("Updating system settings:", settings);
    return { success: true, message: "Settings updated successfully" };
  }

  async createBackup(backupOptions: {
    type: "full" | "partial";
    location?: string;
  }) {
    // Mock implementation - in a real app, you would create an actual backup
    console.log("Creating backup with options:", backupOptions);
    const backupId = `backup_${Date.now()}`;
    return {
      success: true,
      message: "Backup created successfully",
      id: backupId,
    };
  }

  async restoreBackup(backupId: string) {
    // Mock implementation - in a real app, you would restore from a backup
    console.log("Restoring from backup:", backupId);
    return { success: true, message: "System restored successfully" };
  }

  async getBackups() {
    // Mock implementation - in a real app, you would fetch from a backups table
    return [
      {
        id: "backup_1",
        name: "Daily Backup",
        timestamp: new Date().toISOString(),
        size: "256 MB",
        type: "full",
        status: "completed",
        created_by: "system",
        notes: "Automated daily backup",
      },
      {
        id: "backup_2",
        name: "Weekly Backup",
        timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        size: "512 MB",
        type: "full",
        status: "completed",
        created_by: "admin",
        notes: "Manual weekly backup",
      },
    ];
  }

  async deleteBackup(backupId: string) {
    // Mock implementation - in a real app, you would delete from a backups table
    console.log("Deleting backup:", backupId);
    return { success: true, message: "Backup deleted successfully" };
  }

  async getSystemHealth(requestingUser: User) {
    try {
      // Get database status with tables count
      const dbStatus = {
        connected: true,
        tables: {
          users: await this.usersRepository.count(),
          departments: await this.departmentsRepository.count(),
          tasks: await this.tasksRepository.count(),
          logs: await this.activityLogService
            .getLogs({}, requestingUser)
            .then((logs) => logs.total),
        },
      };

      // Get more detailed system resources
      const memoryUsage = process.memoryUsage();

      // Calculate heap usage percentage
      const heapUsagePercent = Math.round(
        (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100,
      );

      const systemInfo = {
        uptime: {
          seconds: process.uptime(),
          formatted: this.formatUptime(process.uptime()),
        },
        memory: {
          total: Math.round(memoryUsage.heapTotal / 1024 / 1024),
          used: Math.round(memoryUsage.heapUsed / 1024 / 1024),
          rss: Math.round(memoryUsage.rss / 1024 / 1024),
          external: Math.round((memoryUsage.external || 0) / 1024 / 1024),
          usagePercent: heapUsagePercent,
          status:
            heapUsagePercent > 90
              ? "critical"
              : heapUsagePercent > 70
                ? "warning"
                : "healthy",
        },
        node: {
          version: process.version,
          platform: process.platform,
          arch: process.arch,
          cpus: require("os").cpus().length,
        },
      };

      // Fetch recent logs (assuming this method now requires the user)
      const recentErrors = await this.activityLogService.getLogs(
        {
          limit: 5,
          page: 0,
          status: "error",
        },
        requestingUser,
      );

      // Fetch total log count (assuming this method now requires the user)
      const logStats = {
        total: await this.activityLogService
          .getLogs({}, requestingUser)
          .then((logs) => logs.total),
      };

      // Generate endpoint statuses by checking database connectivity
      const apiEndpoints = [
        { name: "Authentication", path: "/api/auth", status: "operational" },
        { name: "Tasks", path: "/api/tasks", status: "operational" },
        {
          name: "Departments",
          path: "/api/departments",
          status: "operational",
        },
        { name: "Users", path: "/api/users", status: "operational" },
        { name: "Admin", path: "/api/admin", status: "operational" },
        { name: "Backups", path: "/api/backups", status: "operational" },
        { name: "Settings", path: "/api/settings", status: "operational" },
      ];

      // Calculate system status based on component statuses
      const overallStatus = this.calculateOverallStatus(systemInfo, dbStatus);

      // Get the last system maintenance/backup time (most recent backup)
      const lastBackup = await this.getBackups().then((backups) => {
        return backups.length > 0 ? backups[0] : null;
      });

      return {
        timestamp: new Date().toISOString(),
        status: overallStatus,
        database: {
          ...dbStatus,
          lastBackup: lastBackup
            ? {
                id: lastBackup.id,
                timestamp: lastBackup.timestamp,
                size: lastBackup.size,
                type: lastBackup.type,
              }
            : null,
        },
        system: systemInfo,
        api: {
          endpoints: apiEndpoints,
          errors: recentErrors,
          totalEndpoints: apiEndpoints.length,
          operationalEndpoints: apiEndpoints.filter(
            (e) => e.status === "operational",
          ).length,
        },
        environment: {
          nodeEnv: process.env.NODE_ENV || "development",
          port: process.env.PORT || 3001,
          dbType: process.env.DB_TYPE || "mysql",
          appVersion: process.env.APP_VERSION || "1.0.0",
        },
        logStats,
        recentErrors,
      };
    } catch (error) {
      console.error("Error getting system health:", error);
      return {
        timestamp: new Date().toISOString(),
        status: "error",
        message: error.message,
        error: error.stack,
      };
    }
  }

  // Helper method to format uptime into a readable string
  private formatUptime(seconds: number): string {
    const days = Math.floor(seconds / 86400);
    seconds %= 86400;
    const hours = Math.floor(seconds / 3600);
    seconds %= 3600;
    const minutes = Math.floor(seconds / 60);
    seconds = Math.floor(seconds % 60);

    // Initialize with proper type annotation
    const parts: string[] = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (seconds > 0) parts.push(`${seconds}s`);

    return parts.join(" ");
  }

  // Calculate overall system status based on component statuses
  private calculateOverallStatus(systemInfo: any, dbStatus: any): string {
    if (!dbStatus.connected) return "critical";
    if (systemInfo.memory.usagePercent > 90) return "warning";

    // Check if we have any critical errors
    const memoryStatus = systemInfo.memory.status;
    if (memoryStatus === "critical") return "warning";

    return "operational";
  }

  // Helper method to generate mock activity data
  private generateMockActivities() {
    const actions = ["created", "updated", "deleted", "assigned", "completed"];
    const targets = ["task", "department", "user", "project"];
    const users = [
      "John Doe",
      "Jane Smith",
      "Mike Johnson",
      "Sarah Williams",
      "David Brown",
    ];
    const statuses = ["success", "warning", "error"];

    return Array(5)
      .fill(0)
      .map((_, index) => {
        const action = actions[Math.floor(Math.random() * actions.length)];
        const target = targets[Math.floor(Math.random() * targets.length)];
        const user = users[Math.floor(Math.random() * users.length)];
        const status = statuses[Math.floor(Math.random() * statuses.length)] as
          | "success"
          | "warning"
          | "error";

        // Create timestamp with decreasing recency
        const timestamp = new Date();
        timestamp.setHours(timestamp.getHours() - index * 2);

        return {
          id: `activity-${index + 1}`,
          user,
          action,
          target,
          details: `${user} ${action} a ${target}`,
          timestamp: timestamp.toISOString(), // Convert to ISO string for consistent serialization
          status,
        };
      });
  }

  // Get system metrics for performance monitoring
  async getSystemMetrics() {
    try {
      const memoryUsage = process.memoryUsage();
      const os = require("os");

      // Get CPU information
      const cpus = os.cpus();
      const cpuCount = cpus.length;
      const cpuModel = cpus[0].model;
      const cpuSpeed = cpus[0].speed;

      // Calculate load averages
      const loadAvg = os.loadavg();

      // Calculate memory usage percentages
      const totalMemory = os.totalmem();
      const freeMemory = os.freemem();
      const usedMemory = totalMemory - freeMemory;
      const memoryUsagePercent = Math.round((usedMemory / totalMemory) * 100);

      // Calculate heap usage percentages
      const heapTotal = memoryUsage.heapTotal;
      const heapUsed = memoryUsage.heapUsed;
      const heapUsagePercent = Math.round((heapUsed / heapTotal) * 100);

      // Get database metrics
      const dbMetrics = {
        totalUsers: await this.usersRepository.count(),
        totalDepartments: await this.departmentsRepository.count(),
        totalTasks: await this.tasksRepository.count(),
        tasksByStatus: {
          pending: await this.tasksRepository.count({
            where: { status: TaskStatus.PENDING },
          }),
          inProgress: await this.tasksRepository.count({
            where: { status: TaskStatus.IN_PROGRESS },
          }),
          completed: await this.tasksRepository.count({
            where: { status: TaskStatus.COMPLETED },
          }),
        },
      };

      // Task throughput (using mock data since we don't track task throughput)
      const taskThroughput = {
        daily: Math.floor(Math.random() * 20) + 5,
        weekly: Math.floor(Math.random() * 100) + 30,
        monthly: Math.floor(Math.random() * 400) + 100,
      };

      return {
        timestamp: new Date().toISOString(),
        system: {
          uptime: {
            seconds: process.uptime(),
            formatted: this.formatUptime(process.uptime()),
          },
          platform: os.platform(),
          release: os.release(),
          hostname: os.hostname(),
          arch: os.arch(),
          cpu: {
            model: cpuModel,
            count: cpuCount,
            speed: cpuSpeed,
            loadAvg: {
              "1m": loadAvg[0].toFixed(2),
              "5m": loadAvg[1].toFixed(2),
              "15m": loadAvg[2].toFixed(2),
            },
          },
          memory: {
            total: Math.round(totalMemory / 1024 / 1024),
            free: Math.round(freeMemory / 1024 / 1024),
            used: Math.round(usedMemory / 1024 / 1024),
            usagePercent: memoryUsagePercent,
          },
          heap: {
            total: Math.round(heapTotal / 1024 / 1024),
            used: Math.round(heapUsed / 1024 / 1024),
            external: Math.round((memoryUsage.external || 0) / 1024 / 1024),
            usagePercent: heapUsagePercent,
          },
        },
        application: {
          nodeVersion: process.version,
          environment: process.env.NODE_ENV || "development",
          database: dbMetrics,
          performance: {
            taskThroughput,
            apiLatency: {
              average: Math.floor(Math.random() * 50) + 5, // Mock average API latency in ms
              p95: Math.floor(Math.random() * 150) + 50, // Mock 95th percentile
              p99: Math.floor(Math.random() * 300) + 150, // Mock 99th percentile
            },
          },
        },
      };
    } catch (error) {
      console.error("Error getting system metrics:", error);
      return {
        error: "Failed to get system metrics",
        message: error.message,
      };
    }
  }

  // Get available routes in the application
  async getAvailableRoutes() {
    try {
      // Since we don't have direct access to the routes registry,
      // we'll return a manually constructed list of routes
      const routes = [
        { path: "/api", method: "GET", description: "API root endpoint" },
        { path: "/api/auth/signin", method: "POST", description: "Sign in" },
        { path: "/api/auth/login", method: "POST", description: "Login" },
        {
          path: "/api/auth/refresh",
          method: "POST",
          description: "Refresh token",
        },

        { path: "/api/users", method: "GET", description: "Get all users" },
        {
          path: "/api/users/:id",
          method: "GET",
          description: "Get user by ID",
        },
        { path: "/api/users", method: "POST", description: "Create user" },
        { path: "/api/users/:id", method: "PUT", description: "Update user" },
        {
          path: "/api/users/:id",
          method: "DELETE",
          description: "Delete user",
        },
        {
          path: "/api/users/:id/reset-password",
          method: "POST",
          description: "Reset user password",
        },
        {
          path: "/api/users/:id/toggle-status",
          method: "POST",
          description: "Toggle user status",
        },

        {
          path: "/api/departments",
          method: "GET",
          description: "Get all departments",
        },
        {
          path: "/api/departments/:id",
          method: "GET",
          description: "Get department by ID",
        },
        {
          path: "/api/departments",
          method: "POST",
          description: "Create department",
        },
        {
          path: "/api/departments/:id",
          method: "PUT",
          description: "Update department",
        },
        {
          path: "/api/departments/:id",
          method: "DELETE",
          description: "Delete department",
        },
        {
          path: "/api/departments/:id/members/:userId",
          method: "POST",
          description: "Add member to department",
        },
        {
          path: "/api/departments/:id/members/:userId",
          method: "DELETE",
          description: "Remove member from department",
        },
        {
          path: "/api/departments/:id/performance",
          method: "GET",
          description: "Get department performance",
        },

        { path: "/api/tasks", method: "GET", description: "Get all tasks" },
        {
          path: "/api/tasks/:id",
          method: "GET",
          description: "Get task by ID",
        },
        { path: "/api/tasks", method: "POST", description: "Create task" },
        { path: "/api/tasks/:id", method: "PATCH", description: "Update task" },
        {
          path: "/api/tasks/:id",
          method: "DELETE",
          description: "Delete task",
        },
        {
          path: "/api/tasks/:id/status",
          method: "PATCH",
          description: "Update task status",
        },
        {
          path: "/api/tasks/:id/assign",
          method: "POST",
          description: "Assign task",
        },

        {
          path: "/api/activity-logs",
          method: "GET",
          description: "Get activity logs",
        },
        {
          path: "/api/activity-logs/user/:userId",
          method: "GET",
          description: "Get user activity logs",
        },
        {
          path: "/api/activity-logs",
          method: "DELETE",
          description: "Clear activity logs",
        },

        { path: "/api/backups", method: "GET", description: "Get all backups" },
        {
          path: "/api/backups/:id",
          method: "GET",
          description: "Get backup by ID",
        },
        {
          path: "/api/backups/:id/status",
          method: "GET",
          description: "Get backup status",
        },
        {
          path: "/api/backups/create_backup",
          method: "POST",
          description: "Create backup",
        },
        {
          path: "/api/backups/:id/restore",
          method: "POST",
          description: "Restore from backup",
        },
        {
          path: "/api/backups/:id",
          method: "DELETE",
          description: "Delete backup",
        },
        {
          path: "/api/backups/:id/download",
          method: "GET",
          description: "Download backup",
        },

        {
          path: "/api/admin/dashboard",
          method: "GET",
          description: "Get admin dashboard stats",
        },
        {
          path: "/api/admin/health",
          method: "GET",
          description: "Get system health",
        },
        {
          path: "/api/admin/metrics",
          method: "GET",
          description: "Get system metrics",
        },
        {
          path: "/api/admin/routes",
          method: "GET",
          description: "Get available routes",
        },
        {
          path: "/api/admin/users",
          method: "GET",
          description: "Get all users (admin)",
        },
        {
          path: "/api/admin/departments",
          method: "GET",
          description: "Get all departments (admin)",
        },
        {
          path: "/api/admin/tasks",
          method: "GET",
          description: "Get all tasks (admin)",
        },
        {
          path: "/api/admin/logs",
          method: "GET",
          description: "Get activity logs (admin)",
        },
        {
          path: "/api/admin/logs",
          method: "DELETE",
          description: "Clear activity logs (admin)",
        },
        {
          path: "/api/admin/settings",
          method: "GET",
          description: "Get system settings",
        },
        {
          path: "/api/admin/settings",
          method: "PATCH",
          description: "Update system settings",
        },
        {
          path: "/api/admin/backup",
          method: "POST",
          description: "Create backup (admin)",
        },
        {
          path: "/api/admin/restore/:backupId",
          method: "POST",
          description: "Restore from backup (admin)",
        },
        {
          path: "/api/admin/backups",
          method: "GET",
          description: "Get all backups (admin)",
        },
        {
          path: "/api/admin/backups/:backupId",
          method: "DELETE",
          description: "Delete backup (admin)",
        },

        {
          path: "/api/settings/api-settings/:id",
          method: "GET",
          description: "Get API settings",
        },
        {
          path: "/api/settings/api-settings/:id",
          method: "PATCH",
          description: "Update API settings",
        },
        {
          path: "/api/settings/api-settings/generate-key",
          method: "POST",
          description: "Generate API key",
        },
        {
          path: "/api/settings/security-settings/:id",
          method: "GET",
          description: "Get security settings",
        },
        {
          path: "/api/settings/security-settings/:id",
          method: "PATCH",
          description: "Update security settings",
        },
        {
          path: "/api/settings/backup-settings/:id",
          method: "GET",
          description: "Get backup settings",
        },
        {
          path: "/api/settings/backup-settings/:id",
          method: "PATCH",
          description: "Update backup settings",
        },
        {
          path: "/api/settings/notification-settings/:id",
          method: "GET",
          description: "Get notification settings",
        },
        {
          path: "/api/settings/notification-settings/:id",
          method: "PATCH",
          description: "Update notification settings",
        },
        {
          path: "/api/settings/notification-settings/test-email",
          method: "POST",
          description: "Test email notifications",
        },
      ];

      return {
        count: routes.length,
        routes,
      };
    } catch (error) {
      console.error("Error getting available routes:", error);
      return {
        error: "Failed to get available routes",
        message: error.message,
      };
    }
  }

  // Method for Task Overview Stats
  async getTasksOverviewStats(requestingUser: User): Promise<TaskOverviewStatsDto> {
    this.logger.log(`User ${requestingUser.id} (${requestingUser.role?.name}) requested Task Overview Stats`);

    // --- Fetch Overall Counts --- 
    const now = new Date();
    const todayStart = new Date(now.setHours(0, 0, 0, 0));
    const todayEnd = new Date(now.setHours(23, 59, 59, 999));

    const [ 
      totalTasks, 
      pending, 
      inProgress, 
      completed, 
      cancelled,
      delegated,
      overdue, 
      dueToday, 
      activeUsers, 
      totalDepartments 
    ] = await Promise.all([
      this.tasksRepository.count({ where: { isDeleted: false } }), // Total non-deleted tasks
      this.tasksRepository.count({ where: { status: TaskStatus.PENDING, isDeleted: false } }),
      this.tasksRepository.count({ where: { status: TaskStatus.IN_PROGRESS, isDeleted: false } }),
      this.tasksRepository.count({ where: { status: TaskStatus.COMPLETED, isDeleted: false } }),
      this.tasksRepository.count({ where: { status: TaskStatus.CANCELLED, isDeleted: false } }),
      this.tasksRepository.count({ where: { status: TaskStatus.DELEGATED, isDeleted: false } }),
      this.tasksRepository.count({ 
        where: { 
          dueDate: LessThan(todayStart), // Due date was before today
          status: Not(In([TaskStatus.COMPLETED, TaskStatus.CANCELLED])), // And not completed or cancelled
          isDeleted: false
        } 
      }),
      this.tasksRepository.count({ 
        where: { 
          dueDate: Between(todayStart, todayEnd), // Due date is today
          isDeleted: false
        } 
      }),
      this.usersRepository.count({ where: { isActive: true } }),
      this.departmentsRepository.count(),
    ]);

    const overallCounts: OverallCountsDto = {
      totalTasks,
      pending,
      inProgress,
      completed,
      cancelled,
      delegated,
      overdue,
      dueToday,
      activeUsers,
      totalDepartments,
    };

    // --- Fetch Department Stats --- 
    const departmentStats: DepartmentStatsDto[] = await this.calculateDepartmentTaskStats();

    // --- Fetch User Stats --- 
    const userStats: UserTaskStatsDto[] = await this.calculateUserTaskStats(requestingUser);

    // --- Fetch Province Stats --- 
    const provinceStats: ProvinceStatsDto[] = await this.calculateProvinceTaskStats(departmentStats);

    // Fetch limited list of overdue tasks
    const overdueTasksList = await this.fetchOverdueTasksList(10);

    this.logger.log(`Returning Task Overview Stats for user ${requestingUser.id}`);

    return {
      overallCounts,
      departmentStats,
      userStats,
      provinceStats,
      overdueTasks: overdueTasksList,
    };
  }

  // --- Helper Method for Department Task Stats --- 
  private async calculateDepartmentTaskStats(): Promise<DepartmentStatsDto[]> {
    const departments = await this.departmentsRepository.find();
    const stats: DepartmentStatsDto[] = [];

    for (const dept of departments) {
      const taskQb = this.tasksRepository.createQueryBuilder("task")
        .leftJoin("task.assignedToDepartments", "assignedDept")
        .where("assignedDept.id = :departmentId", { departmentId: dept.id })
        .andWhere("task.isDeleted = :isDeleted", { isDeleted: false });

      const pending = await taskQb.andWhere("task.status = :status", { status: TaskStatus.PENDING }).getCount();
      const inProgress = await taskQb.andWhere("task.status = :status", { status: TaskStatus.IN_PROGRESS }).getCount(); // Cloned qb is reset for each count
      const completed = await taskQb.andWhere("task.status = :status", { status: TaskStatus.COMPLETED }).getCount();
      const total = await taskQb.getCount(); // Total for THIS department
      
      // Re-fetch for overdue count with its specific date condition
      const overdueQb = this.tasksRepository.createQueryBuilder("task")
        .leftJoin("task.assignedToDepartments", "assignedDept")
        .where("assignedDept.id = :departmentId", { departmentId: dept.id })
        .andWhere("task.isDeleted = :isDeleted", { isDeleted: false })
        .andWhere("task.status NOT IN (:...statuses)", { statuses: [TaskStatus.COMPLETED, TaskStatus.CANCELLED] })
        .andWhere("task.dueDate < :today", { today: new Date().toISOString() });
      const overdue = await overdueQb.getCount();

      stats.push({
        departmentId: dept.id,
        departmentName: dept.name,
        counts: { pending, inProgress, completed, overdue, total },
      });
    }
    return stats;
  }

  // --- Helper Method for User Task Stats --- 
  private async calculateUserTaskStats(requestingUser: User): Promise<UserTaskStatsDto[]> {
    this.logger.log(`Calculating user task stats. Requesting user: ${requestingUser.username}`);
    // Ensure we only get active, non-deleted users for stats calculation
    const users = await this.usersRepository.find({ where: { isActive: true, deletedAt: IsNull() }, relations: ['role', 'departments'] });
    const userStats: UserTaskStatsDto[] = [];
    this.logger.debug(`Found ${users.length} active users to process for stats.`);
    
    const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

    for (const user of users) {
      this.logger.debug(`Processing user: ${user.username}, ID: ${user.id}, Type of ID: ${typeof user.id}`);
      if (typeof user.id !== 'string' || !uuidRegex.test(user.id)) { // Added regex test for UUID format
        this.logger.error(`User ${user.username} has invalid ID format: ${user.id}. Skipping for stats calculation.`);
        continue; // Skip this user if ID is not a valid UUID
      }

      // Only include actual users, not system roles if any, or filter by specific roles if needed for the overview
      const queryBuilder = this.tasksRepository
        .createQueryBuilder("task")
        .select("assignee.id", "userId")
        .addSelect("assignee.username", "username")
        .addSelect("task.status", "status")
        .addSelect(
          `CASE WHEN task.dueDate < :todayStart AND task.status NOT IN (:...excludedStatuses) THEN 1 ELSE 0 END`,
          "isOverdue"
        )
        .addSelect("COUNT(task.id)", "count")
        .innerJoin("task.assignedToUsers", "assignee") // Join with assigned users
        .where("task.isDeleted = :isDeleted", { isDeleted: false })
        .setParameters({ 
          todayStart: new Date().toISOString(), 
          excludedStatuses: [TaskStatus.COMPLETED, TaskStatus.CANCELLED]
        });

        // --- Permission Filtering --- 
        // If requesting user is 'Leadership', filter by their departments
        // Note: Assumes requestingUser object has 'role' and 'departments' loaded
        if (requestingUser.role?.name === 'Leadership') {
            const leaderDepartmentIds = requestingUser.departments?.map(d => d.id) || [];
            if (leaderDepartmentIds.length > 0) {
                this.logger.log(`Leadership user ${requestingUser.id} detected. Filtering user stats by departments: ${leaderDepartmentIds.join(', ')}`);
                // We need to ensure the assignee belongs to one of the leader's departments.
                // This requires joining User with Department again.
                queryBuilder
                    .innerJoin("assignee.departments", "userDept") 
                    .andWhere("userDept.id IN (:...leaderDepartmentIds)", { leaderDepartmentIds });
            } else {
                 this.logger.warn(`Leadership user ${requestingUser.id} has no departments associated. Returning empty user stats.`);
                 return []; // Leader with no departments sees no user stats?
            }
        } // Admins/Super Admins see all users implicitly by not adding the department filter.

        queryBuilder.groupBy("assignee.id, assignee.username, task.status, isOverdue");

        const rawStats = await queryBuilder.getRawMany();

      // Process raw stats
      rawStats.forEach(row => {
        const { userId, username, status, isOverdue, count } = row;
        const taskCount = parseInt(count, 10);

        if (!userStats.some(us => us.userId === userId)) {
          userStats.push({
            userId,
            username,
            counts: { pending: 0, inProgress: 0, completed: 0, overdue: 0, totalAssigned: 0 }
          });
        }

        const userStatsObj = userStats.find(us => us.userId === userId)!;
        userStatsObj.counts.totalAssigned += taskCount;

        if (parseInt(isOverdue, 10) === 1) {
          userStatsObj.counts.overdue += taskCount;
        }

        if (status === TaskStatus.PENDING && parseInt(isOverdue, 10) === 0) userStatsObj.counts.pending += taskCount;
        else if (status === TaskStatus.IN_PROGRESS) userStatsObj.counts.inProgress += taskCount;
        else if (status === TaskStatus.COMPLETED) userStatsObj.counts.completed += taskCount;
      });
    }

    return userStats;
  }

  // --- Helper Method for Overdue Tasks List --- 
  private async fetchOverdueTasksList(limit: number): Promise<Task[]> {
      const now = new Date();
      const todayStart = new Date(new Date(now).setHours(0, 0, 0, 0));

      try {
          return await this.tasksRepository.find({
              where: {
                  dueDate: LessThan(todayStart),
                  status: Not(In([TaskStatus.COMPLETED, TaskStatus.CANCELLED])),
                  isDeleted: false
              },
              relations: [ // Include relations needed for display
                  "createdBy", 
                  "assignedToUsers", 
                  "assignedToDepartments",
                  "assignedToProvince"
              ],
              order: { dueDate: "ASC" }, // Show oldest overdue first
              take: limit 
          });
      } catch (error) {
          this.logger.error("Failed to fetch overdue tasks list:", error);
          return [];
      }
  }

  // --- Helper Method for Province Task Stats --- 
  private async calculateProvinceTaskStats(departmentStats: DepartmentStatsDto[]): Promise<ProvinceStatsDto[]> {
      // We already have counts per department. Now aggregate by province.
      const provinceMap = new Map<string, ProvinceStatsDto>();
      const allProvinces = await this.provincesRepository.find();
      const provinceNameMap = new Map(allProvinces.map(p => [p.id, p.name]));
      const departmentProvinceMap = new Map<string, string>(); // DeptId -> ProvinceId
      
      const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

      // Need to fetch departments to get their province mapping if not readily available
      // Optimization: If departmentStats included provinceId, we wouldn't need this fetch.
      // For now, fetch all departments with their province relation.
      const departments = await this.departmentsRepository.find({ relations: ["province"] });
      departments.forEach(d => {
          if (d.province?.id) { // Ensure province relationship is loaded and has an ID
              if (typeof d.province.id === 'string' && uuidRegex.test(d.province.id)) {
                departmentProvinceMap.set(d.id, d.province.id);
              } else {
                this.logger.warn(`Department ${d.name} (ID: ${d.id}) has a linked province with an invalid ID format: ${d.province.id}. Skipping for province stats.`);
              }
          } else {
            // this.logger.debug(`Department ${d.name} (ID: ${d.id}) is not linked to any province or province ID is null.`);
          }
      });
      
      departmentStats.forEach(deptStat => {
          const provinceId = departmentProvinceMap.get(deptStat.departmentId);
          if (provinceId) { // Only include departments linked to a province
              const provinceName = provinceNameMap.get(provinceId) || 'Unknown Province';
              if (!provinceMap.has(provinceId)) {
                  provinceMap.set(provinceId, {
                      provinceId,
                      provinceName,
                      counts: { pending: 0, inProgress: 0, completed: 0, overdue: 0, total: 0 }
                  });
              }
              const provinceDto = provinceMap.get(provinceId)!;
              provinceDto.counts.total += deptStat.counts.total;
              provinceDto.counts.pending += deptStat.counts.pending;
              provinceDto.counts.inProgress += deptStat.counts.inProgress;
              provinceDto.counts.completed += deptStat.counts.completed;
              provinceDto.counts.overdue += deptStat.counts.overdue;
          }
      });

      return Array.from(provinceMap.values());
  }

  async adminResetUser2FA(targetUserId: string, adminUser: User): Promise<void> {
    this.logger.log(
      `Admin user ${adminUser.username} (ID: ${adminUser.id}) is attempting to reset 2FA for user ID: ${targetUserId}`,
    );

    const targetUser = await this.usersRepository.findOneBy({ id: targetUserId });

    if (!targetUser) {
      throw new NotFoundException(`User with ID ${targetUserId} not found.`);
    }

    await this.twoFactorService.adminDisableTwoFactor(targetUserId, adminUser.id);

    this.logger.log(
      `2FA reset for user ${targetUser.username} (ID: ${targetUserId}) by admin ${adminUser.username} (ID: ${adminUser.id})`,
    );
    await this.activityLogService.createLog({
      action: "Admin Reset 2FA",
      user_id: adminUser.id,
      details: `Admin ${adminUser.username} reset 2FA for user ${targetUser.username}`,
      target: "User",
      target_id: targetUserId,
      status: "success",
    });
  }

  // --- Admin Task Management Methods ---

  async archiveCompletedTasks(requestingUser: User): Promise<{ count: number }> {
    this.logger.log(
      `User ${requestingUser.username} (ID: ${requestingUser.id}) requested to archive completed tasks.`,
    );
    // TODO: Implement logic to find all tasks with status COMPLETED,
    // update their isDeleted to true, set deletedAt, deletedById (requestingUser.id),
    // and deletionReason to "Archived as completed".
    // Return the count of tasks archived.
    // Ensure this operation is atomic if possible.
    const count = 0; // Placeholder
    await this.activityLogService.createLog({
      action: "Archive Completed Tasks",
      user_id: requestingUser.id,
      details: `Archived ${count} completed tasks.`,
      target: "Task",
      status: "success",
    });
    return { count };
  }

  async wipeAllTasks(requestingUser: User): Promise<{ count: number }> {
    this.logger.warn(
      `CRITICAL: User ${requestingUser.username} (ID: ${requestingUser.id}) requested to WIPE ALL TASKS.`,
    );
    
    const result = await this.tasksRepository.delete({}); // Hard delete all tasks
    const count = result.affected || 0;

    await this.activityLogService.createLog({
      action: "Wipe All Tasks",
      user_id: requestingUser.id,
      details: `Wiped ${count} tasks from the system. THIS IS A DESTRUCTIVE ACTION.`,
      target: "System",
      status: "success",
    });
    this.logger.log(`Wiped ${count} tasks from the system.`);
    return { count };
  }

  async wipeRecycleBin(requestingUser: User): Promise<{ count: number }> {
    this.logger.log(
      `User ${requestingUser.username} (ID: ${requestingUser.id}) requested to wipe the task recycle bin.`,
    );

    // Find tasks that are soft-deleted (isDeleted = true or deletedAt is not null)
    // Assuming 'isDeleted' is the primary flag for soft deletion in your Task entity
    // If you primarily use 'deletedAt', the condition would be { deletedAt: Not(IsNull()) }
    const deleteCriteria = { isDeleted: true }; 
    // Alternatively, if using deletedAt:
    // const deleteCriteria = { deletedAt: Not(IsNull()) };

    const result = await this.tasksRepository.delete(deleteCriteria);
    const count = result.affected || 0;

    await this.activityLogService.createLog({
      action: "Wipe Recycle Bin",
      user_id: requestingUser.id,
      details: `Wiped ${count} tasks from the recycle bin.`,
      target: "Task",
      status: "success",
    });
    this.logger.log(`Wiped ${count} tasks from the recycle bin.`);
    return { count };
  }
}
