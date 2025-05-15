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
  ParseUUIDPipe,
} from "@nestjs/common";
import { NotesService } from "./notes.service";
import { CreateNoteDto } from "./dto/create-note.dto";
import { UpdateNoteDto } from "./dto/update-note.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { Note } from "./entities/note.entity";

@ApiTags("Notes")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("notes")
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @Post()
  @ApiOperation({ summary: "Create a new note for the authenticated user" })
  @ApiResponse({ status: 201, description: "The note has been successfully created.", type: Note })
  @ApiResponse({ status: 400, description: "Invalid input." })
  @ApiResponse({ status: 401, description: "Unauthorized." })
  create(@Body() createNoteDto: CreateNoteDto, @Req() req) {
    return this.notesService.create(createNoteDto, req.user);
  }

  @Get()
  @ApiOperation({ summary: "Get all notes for the authenticated user" })
  @ApiResponse({ status: 200, description: "List of notes.", type: [Note] })
  @ApiResponse({ status: 401, description: "Unauthorized." })
  findAll(@Req() req) {
    return this.notesService.findAllByUser(req.user.userId);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a specific note by ID for the authenticated user" })
  @ApiResponse({ status: 200, description: "The note.", type: Note })
  @ApiResponse({ status: 401, description: "Unauthorized." })
  @ApiResponse({ status: 404, description: "Note not found or access denied." })
  findOne(@Param("id", ParseUUIDPipe) id: string, @Req() req) {
    return this.notesService.findOne(id, req.user.userId);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update a specific note by ID for the authenticated user" })
  @ApiResponse({ status: 200, description: "The note has been successfully updated.", type: Note })
  @ApiResponse({ status: 400, description: "Invalid input." })
  @ApiResponse({ status: 401, description: "Unauthorized." })
  @ApiResponse({ status: 404, description: "Note not found or access denied." })
  update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() updateNoteDto: UpdateNoteDto,
    @Req() req,
  ) {
    return this.notesService.update(id, updateNoteDto, req.user.userId);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete a specific note by ID for the authenticated user" })
  @ApiResponse({ status: 204, description: "The note has been successfully deleted." })
  @ApiResponse({ status: 401, description: "Unauthorized." })
  @ApiResponse({ status: 404, description: "Note not found or access denied." })
  async remove(@Param("id", ParseUUIDPipe) id: string, @Req() req) {
    await this.notesService.remove(id, req.user.userId);
    // Return 204 No Content explicitly by not returning a body
  }
}
