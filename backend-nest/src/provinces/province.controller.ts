import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  Request,
  NotFoundException,
  Query,
} from "@nestjs/common";
import { ProvinceService } from "./province.service";
import { Province } from "./entities/province.entity";
import { CreateProvinceDto } from "./dto/create-province.dto";
import { UpdateProvinceDto } from "./dto/update-province.dto";
import { Department } from "../departments/entities/department.entity";
import { DepartmentsService } from "../departments/departments.service";
import { AssignDepartmentsDto } from "./dto/assign-departments.dto";
import { TasksService } from "../tasks/tasks.service";
import { ActivityLogService } from "../admin/services/activity-log.service";
import { TaskQueryService } from "../tasks/task-query.service";
// Auth related imports
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard"; // Assuming JWT guard for auth
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from "@nestjs/swagger";

@ApiTags("Provinces")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("provinces")
export class ProvinceController {
  constructor(
    private readonly provinceService: ProvinceService,
    private readonly departmentsService: DepartmentsService,
    private readonly tasksService: TasksService,
    private readonly taskQueryService: TaskQueryService,
    private readonly activityLogService: ActivityLogService,
  ) {}

  @Get()
  @ApiOperation({
    summary: "Get accessible provinces (All Authenticated Users)",
  })
  @ApiResponse({
    status: 200,
    description: "List of accessible provinces.",
    type: [Province],
  })
  @ApiResponse({ status: 401, description: "Unauthorized." })
  async findAccessibleProvinces(): Promise<Province[]> {
    return this.provinceService.findAll();
  }

  @Post("admin")
  @ApiOperation({ summary: "Create a new province (Admin Only)" })
  @ApiResponse({
    status: 201,
    description: "Province created successfully.",
    type: Province,
  })
  @ApiResponse({ status: 400, description: "Invalid input data." })
  @ApiResponse({ status: 403, description: "Forbidden (Admin role required)." })
  async create(
    @Body() createProvinceDto: CreateProvinceDto,
  ): Promise<Province> {
    return this.provinceService.create(createProvinceDto);
  }

  @Get("admin")
  @ApiOperation({ summary: "Get all provinces (Admin Only)" })
  @ApiResponse({
    status: 200,
    description: "List of all provinces.",
    type: [Province],
  })
  @ApiResponse({ status: 403, description: "Forbidden (Admin role required)." })
  async findAllAdmin(): Promise<Province[]> {
    return this.provinceService.findAll();
  }

  @Get("admin/:id")
  @ApiOperation({ summary: "Get a specific province by ID (Admin Only)" })
  @ApiParam({ name: "id", description: "Province UUID", type: String })
  @ApiResponse({
    status: 200,
    description: "Province details.",
    type: Province,
  })
  @ApiResponse({ status: 403, description: "Forbidden (Admin role required)." })
  @ApiResponse({ status: 404, description: "Province not found." })
  async findOneAdmin(
    @Param("id", ParseUUIDPipe) id: string,
  ): Promise<Province> {
    return this.provinceService.findOne(id);
  }

  @Put("admin/:id")
  @ApiOperation({ summary: "Update a province by ID (Admin Only)" })
  @ApiParam({ name: "id", description: "Province UUID", type: String })
  @ApiResponse({
    status: 200,
    description: "Province updated successfully.",
    type: Province,
  })
  @ApiResponse({ status: 400, description: "Invalid input data." })
  @ApiResponse({ status: 403, description: "Forbidden (Admin role required)." })
  @ApiResponse({ status: 404, description: "Province not found." })
  async updateAdmin(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() updateProvinceDto: UpdateProvinceDto,
  ): Promise<Province> {
    return this.provinceService.update(id, updateProvinceDto);
  }

  @Delete("admin/:id")
  @ApiOperation({ summary: "Delete a province by ID (Admin Only)" })
  @ApiParam({ name: "id", description: "Province UUID", type: String })
  @ApiResponse({ status: 204, description: "Province deleted successfully." })
  @ApiResponse({ status: 403, description: "Forbidden (Admin role required)." })
  @ApiResponse({ status: 404, description: "Province not found." })
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeAdmin(@Param("id", ParseUUIDPipe) id: string): Promise<void> {
    await this.provinceService.remove(id);
  }

  @Get("admin/:provinceId/departments")
  @ApiOperation({
    summary: "Get departments assigned to a province (Admin Only)",
  })
  @ApiParam({ name: "provinceId", description: "Province UUID", type: String })
  @ApiResponse({
    status: 200,
    description: "List of departments in the province.",
    type: [Department],
  })
  @ApiResponse({ status: 403, description: "Forbidden." })
  @ApiResponse({ status: 404, description: "Province not found." })
  async getProvinceDepartmentsAdmin(
    @Param("provinceId", ParseUUIDPipe) provinceId: string,
  ): Promise<Department[]> {
    const province = await this.provinceService.findOne(provinceId);
    return province.departments;
  }

  @Post("admin/:provinceId/departments")
  @ApiOperation({ summary: "Assign department(s) to a province (Admin Only)" })
  @ApiParam({ name: "provinceId", description: "Province UUID", type: String })
  @ApiResponse({
    status: 200,
    description: "Departments assigned successfully.",
    type: Province,
  })
  @ApiResponse({
    status: 400,
    description: "Invalid input data (e.g., bad department IDs).",
  })
  @ApiResponse({ status: 403, description: "Forbidden." })
  @ApiResponse({
    status: 404,
    description: "Province or one/more Departments not found.",
  })
  async assignDepartmentsToProvinceAdmin(
    @Param("provinceId", ParseUUIDPipe) provinceId: string,
    @Body() assignDepartmentsDto: AssignDepartmentsDto,
  ): Promise<Province> {
    return this.departmentsService.assignDepartmentsToProvince(
      provinceId,
      assignDepartmentsDto.departmentIds,
    );
  }

  @Delete("admin/:provinceId/departments/:departmentId")
  @ApiOperation({ summary: "Remove a department from a province (Admin Only)" })
  @ApiParam({ name: "provinceId", description: "Province UUID", type: String })
  @ApiParam({
    name: "departmentId",
    description: "Department UUID to remove",
    type: String,
  })
  @ApiResponse({ status: 204, description: "Department removed successfully." })
  @ApiResponse({ status: 403, description: "Forbidden." })
  @ApiResponse({
    status: 404,
    description: "Province or Department not found.",
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeDepartmentFromProvinceAdmin(
    @Param("provinceId", ParseUUIDPipe) provinceId: string,
    @Param("departmentId", ParseUUIDPipe) departmentId: string,
  ): Promise<void> {
    await this.departmentsService.removeDepartmentFromProvince(
      provinceId,
      departmentId,
    );
  }

  @Get(":id/tasks")
  @ApiOperation({ summary: "Get tasks for a specific province" })
  @ApiParam({ name: "id", description: "Province UUID", type: String })
  @ApiResponse({ status: 200, description: "List of tasks for the province." })
  @ApiResponse({ status: 401, description: "Unauthorized." })
  @ApiResponse({ status: 404, description: "Province not found." })
  async getTasksForProvince(@Param("id") id: string) {
    const tasks = await this.taskQueryService.getTasksForProvince(id);
    return tasks;
  }

  @Get(":id/performance")
  @ApiOperation({
    summary:
      "Get performance statistics for a province (Admin/Leadership Only)",
  })
  @ApiParam({ name: "id", description: "Province UUID", type: String })
  @ApiResponse({
    status: 200,
    description: "Performance statistics for the province.",
  })
  @ApiResponse({ status: 403, description: "Forbidden." })
  @ApiResponse({ status: 404, description: "Province not found." })
  async getProvincePerformance(
    @Param("id", ParseUUIDPipe) id: string,
    @Request() req,
  ) {
    const performanceStats =
      await this.provinceService.getPerformanceStatistics(id);

    // Log the activity
    try {
      await this.activityLogService.logFromRequest(
        req,
        "view",
        "province_performance",
        `Viewed performance statistics for province: ${performanceStats.provinceName}`,
        id,
      );
    } catch (logError) {
      console.error(
        `Failed to log province performance view activity: ${logError.message}`,
      );
    }

    return performanceStats;
  }

  @Get("performance")
  @ApiOperation({
    summary:
      "Get performance statistics for multiple provinces (Admin/Leadership Only)",
  })
  @ApiResponse({
    status: 200,
    description: "Performance statistics for the provinces.",
  })
  @ApiResponse({ status: 403, description: "Forbidden." })
  async getMultiProvincePerformance(
    @Query("ids") provinceIds: string,
    @Request() req,
  ) {
    if (!provinceIds) {
      throw new NotFoundException(
        "Province IDs must be provided as a comma-separated list",
      );
    }

    const ids = provinceIds.split(",");
    const performanceStats =
      await this.provinceService.getMultiProvincePerformance(ids);

    // Log the activity
    try {
      await this.activityLogService.logFromRequest(
        req,
        "view",
        "provinces_performance",
        `Viewed performance statistics for multiple provinces: ${ids.length} provinces`,
      );
    } catch (logError) {
      console.error(
        `Failed to log multi-province performance view activity: ${logError.message}`,
      );
    }

    return performanceStats;
  }
}
