import {
  Controller,
  Get,
  Delete,
  Query,
  UseGuards,
  Request,
  Param,
} from "@nestjs/common";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../rbac/guards/roles.guard";
import { Roles } from "../../rbac/decorators/roles.decorator";
import { ActivityLogService } from "../services/activity-log.service";

// Interface for formatted response
interface FormattedActivityLog {
  id: string;
  user: string;
  user_id?: string;
  action: string;
  target: string;
  target_id?: string;
  details: string;
  timestamp: Date;
  ip_address: string;
  status: "success" | "warning" | "error";
}

interface ActivityLogResponse {
  logs: FormattedActivityLog[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Controller("activity-logs")
@UseGuards(JwtAuthGuard)
export class ActivityLogsController {
  constructor(private readonly activityLogService: ActivityLogService) {}

  @Get()
  @UseGuards(RolesGuard)
  @Roles("admin", "Super Admin")
  async getLogs(
    @Request() req,
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string,
    @Query("action") action?: string,
    @Query("target") target?: string,
    @Query("user_id") user_id?: string,
    @Query("status") status?: string,
    @Query("search") search?: string,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
  ): Promise<ActivityLogResponse> {
    const filters: any = {};

    if (startDate) filters.startDate = new Date(startDate);
    if (endDate) filters.endDate = new Date(endDate);
    if (action) filters.action = action;
    if (target) filters.target = target;
    if (user_id) filters.user_id = user_id;
    if (status) filters.status = status;
    if (search) filters.search = search;
    if (page) filters.page = parseInt(page, 10);
    if (limit) filters.limit = parseInt(limit, 10);

    const result = await this.activityLogService.getLogs(filters, req.user);

    // Format the logs to ensure user is a string
    const formattedLogs = result.logs.map((log) => {
      return {
        ...log,
        user: log.user
          ? typeof log.user === "object"
            ? log.user.username
            : log.user
          : "Unknown User",
      } as FormattedActivityLog;
    });

    return {
      ...result,
      logs: formattedLogs,
    };
  }

  @Get("user/:userId")
  @UseGuards(RolesGuard)
  @Roles("admin", "Super Admin")
  async getUserLogs(
    @Request() req,
    @Param("userId") userId: string,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
  ): Promise<ActivityLogResponse> {
    const result = await this.activityLogService.getLogs(
      {
        user_id: userId,
        page: page ? parseInt(page, 10) : 0,
        limit: limit ? parseInt(limit, 10) : 10,
      },
      req.user,
    );

    // Format the logs to ensure user is a string
    const formattedLogs = result.logs.map((log) => {
      return {
        ...log,
        user: log.user
          ? typeof log.user === "object"
            ? log.user.username
            : log.user
          : "Unknown User",
      } as FormattedActivityLog;
    });

    return {
      ...result,
      logs: formattedLogs,
    };
  }

  @Delete()
  @UseGuards(RolesGuard)
  @Roles("admin", "Super Admin")
  async clearLogs() {
    return this.activityLogService.clearLogs();
  }
}
