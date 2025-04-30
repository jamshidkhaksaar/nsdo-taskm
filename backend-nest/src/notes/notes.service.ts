import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Note } from "./entities/note.entity";
import { CreateNoteDto } from "./dto/create-note.dto";
import { UpdateNoteDto } from "./dto/update-note.dto";

@Injectable()
export class NotesService {
  constructor(
    @InjectRepository(Note)
    private notesRepository: Repository<Note>,
  ) {}

  async findAll(userId: string): Promise<Note[]> {
    return this.notesRepository.find({
      where: { userId },
      order: { createdAt: "DESC" },
    });
  }

  async findOne(id: string, userId: string): Promise<Note> {
    const note = await this.notesRepository.findOne({
      where: { id, userId },
    });

    if (!note) {
      throw new NotFoundException(`Note with ID ${id} not found`);
    }

    return note;
  }

  async create(createNoteDto: CreateNoteDto, userId: string): Promise<Note> {
    const note = this.notesRepository.create({
      ...createNoteDto,
      userId,
    });

    return this.notesRepository.save(note);
  }

  async update(
    id: string,
    updateNoteDto: UpdateNoteDto,
    userId: string,
  ): Promise<Note> {
    const note = await this.findOne(id, userId);

    Object.assign(note, updateNoteDto);

    return this.notesRepository.save(note);
  }

  async remove(id: string, userId: string): Promise<void> {
    const note = await this.findOne(id, userId);

    await this.notesRepository.remove(note);
  }
}
