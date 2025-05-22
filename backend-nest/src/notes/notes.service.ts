import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Note } from './entities/note.entity';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';

interface AuthenticatedUserPayload {
  id: string;
  username: string;
  // Add other fields from JWT payload if necessary, e.g., role
}

@Injectable()
export class NotesService {
  constructor(
    @InjectRepository(Note)
    private readonly noteRepository: Repository<Note>,
  ) {}

  async create(createNoteDto: CreateNoteDto, authUser: AuthenticatedUserPayload): Promise<Note> {
    const note = this.noteRepository.create({
      ...createNoteDto,
      user_id: authUser.id,
    });
    return this.noteRepository.save(note);
  }

  async findAllByUser(userId: string): Promise<Note[]> {
    return this.noteRepository.find({
      where: { user_id: userId },
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: string, userId: string): Promise<Note> {
    const note = await this.noteRepository.findOne({ where: { id, user_id: userId } });
    if (!note) {
      throw new NotFoundException(`Note with ID "${id}" not found or access denied.`);
    }
    return note;
  }

  async update(id: string, updateNoteDto: UpdateNoteDto, userId: string): Promise<Note> {
    const note = await this.findOne(id, userId); // findOne already checks ownership

    // Merge and save
    this.noteRepository.merge(note, updateNoteDto);
    return this.noteRepository.save(note);
  }

  async remove(id: string, userId: string): Promise<void> {
    const note = await this.findOne(id, userId); // findOne already checks ownership
    await this.noteRepository.remove(note);
  }
}
