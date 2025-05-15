import apiClient from '../utils/axios';
import { User } from '../types'; // Assuming User type is available for user context

export interface QuickNote {
  id: string;
  content: string;
  created_at: string; // Changed from createdAt to match backend
  updated_at: string; // Changed from updatedAt to match backend
  color: string;
  user_id?: string; // To be populated by backend
}

const API_URL = '/notes';

export const NoteService = {
  getNotes: async (): Promise<QuickNote[]> => {
    try {
      const response = await apiClient.get<QuickNote[]>(API_URL);
      return response.data;
    } catch (error) {
      console.error('Error fetching notes:', error);
      throw error;
    }
  },

  addNote: async (noteData: { content: string; color?: string }): Promise<QuickNote> => {
    try {
      const response = await apiClient.post<QuickNote>(API_URL, noteData);
      return response.data;
    } catch (error) {
      console.error('Error adding note:', error);
      throw error;
    }
  },

  updateNote: async (noteId: string, noteData: Partial<QuickNote>): Promise<QuickNote> => {
    try {
      const response = await apiClient.patch<QuickNote>(`${API_URL}/${noteId}`, noteData);
      return response.data;
    } catch (error) {
      console.error(`Error updating note ${noteId}:`, error);
      throw error;
    }
  },

  deleteNote: async (noteId: string): Promise<void> => {
    try {
      await apiClient.delete(`${API_URL}/${noteId}`);
    } catch (error) {
      console.error(`Error deleting note ${noteId}:`, error);
      throw error;
    }
  },
}; 