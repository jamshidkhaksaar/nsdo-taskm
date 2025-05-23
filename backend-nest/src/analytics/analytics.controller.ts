import { Controller, Get, Query, Req, UseGuards } from "@nestjs/common";
import { AnalyticsService } from "./analytics.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { GetCompletionRateDto, AnalyticsPeriod } from "./dto/get-completion-rate.dto";

interface RequestWithUser extends Request {
  user: { id: number; [key: string]: any };
}

@Controller("analytics")
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get("productivity")
  async getProductivityMetrics(@Req() req: RequestWithUser) {
    const userId = req.user.id;
    return await this.analyticsService.getProductivityMetrics(userId);
  }

  @Get("completion-rate")
  async getCompletionRate(
    @Req() req: RequestWithUser,
    @Query() queryParams: GetCompletionRateDto,
  ) {
    const userId = req.user.id;
    return await this.analyticsService.getCompletionRate(userId, queryParams.period);
  }

  @Get("task-distribution")
  async getTaskDistribution(@Req() req: RequestWithUser) {
    const userId = req.user.id;
    return await this.analyticsService.getTaskDistribution(userId);
  }

  @Get("recommendations")
  async getRecommendations(@Req() req: RequestWithUser) {
    const userId = req.user.id;
    return await this.analyticsService.getTaskRecommendations(userId);
  }
}
