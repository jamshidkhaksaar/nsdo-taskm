import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  Query,
  ParseUUIDPipe,
  Logger,
} from "@nestjs/common";
import { DepartmentsService } from "../../departments/departments.service";
import { CreateDepartmentDto } from "../../departments/dto/create-department.dto";
import { UpdateDepartmentDto } from "../../departments/dto/update-department.dto";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../rbac/guards/roles.guard";
import { Roles } from "../../rbac/decorators/roles.decorator";
import { Department } from "../../departments/entities/department.entity";
import { ActivityLogService } from "../services/activity-log.service";

@Controller("admin/departments")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("Administrator")
export class AdminDepartmentsController {
  private readonly logger = new Logger(AdminDepartmentsController.name);

  constructor(
    private readonly departmentsService: DepartmentsService,
    private readonly activityLogService: ActivityLogService,
  ) {}

  @Post()
  async create(@Body() createDepartmentDto: CreateDepartmentDto, @Req() req) {
    const result = await this.departmentsService.create(createDepartmentDto);
    this.activityLogService.logFromRequest(
      req,
      "create",
      "department",
      "Created department",
      result.id,
    );
    return result;
  }

  @Get()
  findAll(@Req() req, @Query("provinceId") provinceId?: string) {
    this.activityLogService.logFromRequest(
      req,
      "view",
      "departments",
      "Viewed all departments",
    );
    return this.departmentsService.findAll(provinceId);
  }

  @Get(":id")
  findOne(@Param("id", ParseUUIDPipe) id: string, @Req() req): Promise<Department> {
    this.activityLogService.logFromRequest(
      req,
      "view",
      "department",
      "Viewed department details",
      id,
    );
    return this.departmentsService.findOne(id);
  }

  @Patch(":id")
  update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() updateDepartmentDto: UpdateDepartmentDto,
    @Req() req,
  ) {
    const result = this.departmentsService.update(id, updateDepartmentDto);
    this.activityLogService.logFromRequest(
      req,
      "update",
      "department",
      "Updated department",
      id,
    );
    return result;
  }

  @Delete(":id")
  remove(@Param("id", ParseUUIDPipe) id: string, @Req() req) {
    const result = this.departmentsService.remove(id);
    this.activityLogService.logFromRequest(
      req,
      "delete",
      "department",
      "Deleted department",
      id,
    );
    return result;
  }

  @Post(":id/members/:userId")
  addMember(
    @Param("id", ParseUUIDPipe) id: string,
    @Param("userId", ParseUUIDPipe) userId: string,
    @Req() req,
  ) {
    const result = this.departmentsService.addMember(id, userId);
    this.activityLogService.logFromRequest(
      req,
      "add",
      "department_member",
      `Added user (${userId}) to department`,
      id,
    );
    return result;
  }

  @Delete(":id/members/:userId")
  removeMember(
    @Param("id", ParseUUIDPipe) id: string,
    @Param("userId", ParseUUIDPipe) userId: string,
    @Req() req,
  ) {
    const result = this.departmentsService.removeMember(id, userId);
    this.activityLogService.logFromRequest(
      req,
      "remove",
      "department_member",
      `Removed user (${userId}) from department`,
      id,
    );
    return result;
  }

  @Get(":id/members")
  getDepartmentMembers(@Param("id", ParseUUIDPipe) id: string, @Req() req) {
    this.activityLogService.logFromRequest(
      req,
      "view",
      "department_members",
      "Viewed department members",
      id,
    );
    return this.departmentsService.getDepartmentMembers(id);
  }
}
