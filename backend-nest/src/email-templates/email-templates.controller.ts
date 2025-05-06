import {
  Controller,
  Get,
  Put,
  Param,
  Body,
  UseGuards,
  ValidationPipe,
} from "@nestjs/common";
import { EmailTemplatesService } from "./email-templates.service";
import { UpdateEmailTemplateDto } from "./dto/email-template.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../rbac/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { EmailTemplate } from "./entities/email-template.entity";

@ApiTags("Email Templates")
@ApiBearerAuth()
@Controller("email-templates")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("admin", "Super Admin")
export class EmailTemplatesController {
  constructor(private readonly emailTemplatesService: EmailTemplatesService) {}

  @Get()
  @ApiOperation({ summary: "Get all email templates (Admin only)" })
  @ApiResponse({
    status: 200,
    description: "Returns all email templates.",
    type: [EmailTemplate],
  })
  @ApiResponse({ status: 403, description: "Forbidden." })
  findAll() {
    return this.emailTemplatesService.findAll();
  }

  @Get(":templateKey")
  @ApiOperation({
    summary: "Get a specific email template by key (Admin only)",
  })
  @ApiParam({
    name: "templateKey",
    description: "The key of the template (e.g., PASSWORD_RESET)",
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: "Returns the specific email template.",
    type: EmailTemplate,
  })
  @ApiResponse({ status: 404, description: "Template not found." })
  @ApiResponse({ status: 403, description: "Forbidden." })
  findOne(@Param("templateKey") templateKey: string) {
    return this.emailTemplatesService.findOne(templateKey);
  }

  @Put(":templateKey")
  @ApiOperation({ summary: "Update an email template (Admin only)" })
  @ApiParam({
    name: "templateKey",
    description: "The key of the template to update",
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: "Template updated successfully.",
    type: EmailTemplate,
  })
  @ApiResponse({ status: 404, description: "Template not found." })
  @ApiResponse({ status: 400, description: "Invalid input data." })
  @ApiResponse({ status: 403, description: "Forbidden." })
  update(
    @Param("templateKey") templateKey: string,
    @Body(new ValidationPipe()) updateEmailTemplateDto: UpdateEmailTemplateDto,
  ) {
    return this.emailTemplatesService.update(
      templateKey,
      updateEmailTemplateDto,
    );
  }
}
