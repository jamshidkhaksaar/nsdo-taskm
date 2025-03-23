import axios from '../utils/axios';
import { User } from '../types/user';

export interface Notification {
  id: number;
  message: string;
  type: 'task_created' | 'task_assigned' | 'task_status_changed' | 'collaborator_added' | 'task_due_soon' | 'task_overdue';
  read: boolean;
  user_id: number;
  task_id?: number;
  created_at: string;
}

export const NotificationService = {
  // Get all notifications for the current user
  getNotifications: async (): Promise<Notification[]> => {
    try {
      const response = await axios.get('/api/notifications/user');
      return response.data;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }
  },

  // Get unread notifications for the current user
  getUnreadNotifications: async (): Promise<Notification[]> => {
    try {
      const response = await axios.get('/api/notifications/user/unread');
      return response.data;
    } catch (error) {
      console.error('Error fetching unread notifications:', error);
      return [];
    }
  },

  // Mark a notification as read
  markAsRead: async (notificationId: number): Promise<void> => {
    try {
      await axios.patch(`/api/notifications/${notificationId}/read`);
    } catch (error) {
      console.error(`Error marking notification ${notificationId} as read:`, error);
    }
  },

  // Mark all notifications as read
  markAllAsRead: async (): Promise<void> => {
    try {
      await axios.patch('/api/notifications/user/read-all');
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  },

  // Delete a notification
  deleteNotification: async (notificationId: number): Promise<void> => {
    try {
      await axios.delete(`/api/notifications/${notificationId}`);
    } catch (error) {
      console.error(`Error deleting notification ${notificationId}:`, error);
    }
  }
}; 