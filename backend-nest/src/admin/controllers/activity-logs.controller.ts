import {
  Controller,
  Get,
  Delete,
  Query,
  UseGuards,
  Request,
  Param,
  ParseUUIDPipe,
  Logger,
} from "@nestjs/common";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../rbac/guards/roles.guard";
import { Roles } from "../../rbac/decorators/roles.decorator";
import { ActivityLogService } from "../services/activity-log.service";
import { GetActivityLogsDto } from "../dto/get-activity-logs.dto";
import { PaginationQueryDto } from "../../common/dto/pagination-query.dto";

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
  private readonly logger = new Logger(ActivityLogsController.name);

  constructor(private readonly activityLogService: ActivityLogService) {}

  @Get()
  @UseGuards(RolesGuard)
  @Roles("Administrator")
  async getLogs(
    @Request() req,
    @Query() queryParams: GetActivityLogsDto,
  ): Promise<ActivityLogResponse> {
    const result = await this.activityLogService.getLogs(queryParams, req.user);

    // Format the logs to ensure user is a string
    const formattedLogs = result.logs.map((log) => {
      return {
        ...log,
        user: log.user
          ? typeof log.user === "object"
            ? (log.user as any).username || "N/A"
            : String(log.user)
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
  @Roles("Administrator")
  async getUserLogs(
    @Request() req,
    @Param('userId', ParseUUIDPipe) userId: string,
    @Query() paginationQuery: PaginationQueryDto,
  ): Promise<ActivityLogResponse> {
    const filters = {
      user_id: userId,
      page: paginationQuery.page,
      limit: paginationQuery.limit,
    };
    const result = await this.activityLogService.getLogs(filters, req.user);

    // Format the logs to ensure user is a string
    const formattedLogs = result.logs.map((log) => {
      return {
        ...log,
        user: log.user
          ? typeof log.user === "object"
            ? (log.user as any).username || "N/A"
            : String(log.user)
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
  @Roles("Administrator")
  async clearLogs() {
    return this.activityLogService.clearLogs();
  }
}
