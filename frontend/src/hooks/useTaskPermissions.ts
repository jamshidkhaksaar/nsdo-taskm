import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { Task } from '../types/task';

export interface TaskPermissions {
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canAssignUsers: boolean;
  canAssignToDepartment: boolean;
  canViewAllTasks: boolean;
  canManageStatus: boolean;
}

/**
 * Hook to determine user permissions for tasks based on their role
 */
export const useTaskPermissions = (task?: Task): TaskPermissions => {
  const { user } = useSelector((state: RootState) => state.auth);
  
  // Early return if no user
  if (!user) {
    return {
      canView: false,
      canEdit: false,
      canDelete: false,
      canAssignUsers: false,
      canAssignToDepartment: false,
      canViewAllTasks: false,
      canManageStatus: false,
    };
  }
  
  // Get user role
  const userRole = user.role || 'user';
  const userId = user.id?.toString();
  
  // Check if user is the creator of the task
  const isCreator = task ? (task.created_by?.toString() === userId) : false;
  
  // Check if user is assigned to the task - handle potential undefined with optional chaining and fallback
  const isAssignee = task ? (task.assigned_to?.includes(userId) ?? false) : false;
  
  // Admin permissions
  if (userRole === 'admin') {
    return {
      canView: true,
      canEdit: true,
      canDelete: true,
      canAssignUsers: true,
      canAssignToDepartment: true,
      canViewAllTasks: true,
      canManageStatus: true,
    };
  }
  
  // General Manager permissions
  if (userRole === 'general_manager') {
    return {
      canView: true,
      canEdit: true,
      canDelete: true,
      canAssignUsers: true,
      canAssignToDepartment: true,
      canViewAllTasks: true,
      canManageStatus: true,
    };
  }
  
  // Normal user permissions
  return {
    canView: isCreator || isAssignee,
    canEdit: isCreator,
    canDelete: isCreator,
    canAssignUsers: true, // Can assign from Users page
    canAssignToDepartment: true, // Can assign from Departments page
    canViewAllTasks: false, // Normal users can't view all tasks
    canManageStatus: isCreator || isAssignee, // Can manage status of own or assigned tasks
  };
}; 