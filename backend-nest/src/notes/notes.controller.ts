import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Logger,
  ParseUUIDPipe,
} from "@nestjs/common";
import { NotesService } from "./notes.service";
import { CreateNoteDto } from "./dto/create-note.dto";
import { UpdateNoteDto } from "./dto/update-note.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { GetUser } from "../auth/decorators/get-user.decorator";
import { User } from "../users/entities/user.entity";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";

@ApiTags("Notes")
@Controller("notes")
@UseGuards(JwtAuthGuard)
export class NotesController {
  private readonly logger = new Logger(NotesController.name);

  constructor(private readonly notesService: NotesService) {}

  @Post()
  @ApiOperation({ summary: "Create a new note" })
  @ApiResponse({
    status: 201,
    description: "The note has been successfully created.",
  })
  create(@Body() createNoteDto: CreateNoteDto, @GetUser() user: User) {
    this.logger.log(`Creating note for user ${user.username}`);
    return this.notesService.create(createNoteDto, user.id);
  }

  @Get()
  @ApiOperation({ summary: "Get all notes for the authenticated user" })
  @ApiResponse({ status: 200, description: "Return all notes for the user" })
  findAll(@GetUser() user: User) {
    this.logger.log(`Fetching all notes for user ${user.username}`);
    return this.notesService.findAll(user.id);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a specific note" })
  @ApiResponse({ status: 200, description: "Return the note" })
  @ApiResponse({ status: 404, description: "Note not found" })
  findOne(@Param("id", ParseUUIDPipe) id: string, @GetUser() user: User) {
    this.logger.log(`Fetching note ${id} for user ${user.username}`);
    return this.notesService.findOne(id, user.id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update a note" })
  @ApiResponse({
    status: 200,
    description: "The note has been successfully updated.",
  })
  @ApiResponse({ status: 404, description: "Note not found" })
  update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() updateNoteDto: UpdateNoteDto,
    @GetUser() user: User,
  ) {
    this.logger.log(`Updating note ${id} for user ${user.username}`);
    return this.notesService.update(id, updateNoteDto, user.id);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete a note" })
  @ApiResponse({
    status: 200,
    description: "The note has been successfully deleted.",
  })
  @ApiResponse({ status: 404, description: "Note not found" })
  remove(@Param("id", ParseUUIDPipe) id: string, @GetUser() user: User) {
    this.logger.log(`Deleting note ${id} for user ${user.username}`);
    return this.notesService.remove(id, user.id);
  }
}
