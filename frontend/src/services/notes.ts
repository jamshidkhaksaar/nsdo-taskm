import axios from '../utils/axios';

export interface Note {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  color: string;
  userId: string;
}

export const NotesService = {
  /**
   * Get all notes for the current user
   */
  async getNotes(): Promise<Note[]> {
    try {
      const response = await axios.get('/api/notes');
      return response.data;
    } catch (error) {
      console.error('Error fetching notes:', error);
      return [];
    }
  },

  /**
   * Get a specific note by ID
   */
  async getNote(id: string): Promise<Note | null> {
    try {
      const response = await axios.get(`/api/notes/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching note ${id}:`, error);
      return null;
    }
  },

  /**
   * Create a new note
   */
  async createNote(note: { content: string; color?: string }): Promise<Note | null> {
    try {
      const response = await axios.post('/api/notes', note);
      return response.data;
    } catch (error) {
      console.error('Error creating note:', error);
      return null;
    }
  },

  /**
   * Update an existing note
   */
  async updateNote(id: string, note: { content?: string; color?: string }): Promise<Note | null> {
    try {
      const response = await axios.patch(`/api/notes/${id}`, note);
      return response.data;
    } catch (error) {
      console.error(`Error updating note ${id}:`, error);
      return null;
    }
  },

  /**
   * Delete a note
   */
  async deleteNote(id: string): Promise<boolean> {
    try {
      await axios.delete(`/api/notes/${id}`);
      return true;
    } catch (error) {
      console.error(`Error deleting note ${id}:`, error);
      return false;
    }
  }
}; 