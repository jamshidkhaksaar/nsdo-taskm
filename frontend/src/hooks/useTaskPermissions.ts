import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { Task, TaskType } from '@/types';

export interface TaskPermissions {
  canView: boolean;
  canEdit: boolean; // Creator can edit content/assignees
  canDelete: boolean; // Creator can delete
  canCancel: boolean; // Creator can cancel
  canChangePriority: boolean; // Assignee can change priority
  canUpdateStatus: boolean; // Assignee can update status (e.g., to In Progress, Completed)
  canDelegate: boolean; // Assignee or Dept Head can delegate
  // Maybe add more specific view permissions later if needed
}

/**
 * Hook to determine user permissions for a specific task based on their role and relationship to the task.
 */
export const useTaskPermissions = (task: Task | null | undefined): TaskPermissions => {
  const { user } = useSelector((state: RootState) => state.auth);

  // Default permissions if no user or task
  const defaultPermissions: TaskPermissions = {
    canView: false,
    canEdit: false,
    canDelete: false,
    canCancel: false,
    canChangePriority: false,
    canUpdateStatus: false,
    canDelegate: false,
  };

  if (!user || !task) {
    return defaultPermissions;
  }

  // User details (IDs are strings)
  const userId = user.id;
  const userRole = user.role || 'user';
  // Get department ID as string
  const userDepartmentId = user.department?.id;

  // Task details (IDs are strings)
  const isCreator = userId === task.createdById;

  // Check direct user assignment using assignedToUserIds array
  const isDirectAssignee = !!task.assignedToUserIds?.includes(userId);

  // Check department assignment using assignedToDepartmentIds array
  const isDepartmentAssignee = !!((task.type === TaskType.DEPARTMENT || task.type === TaskType.PROVINCE_DEPARTMENT) &&
                               userDepartmentId &&
                               task.assignedToDepartmentIds?.includes(userDepartmentId));

  // Check if user is a Department Head for an assigned department
  const isDeptHeadOfAssignedDept = !!(userRole === 'department_head' &&
                                   userDepartmentId &&
                                   (task.type === TaskType.DEPARTMENT || task.type === TaskType.PROVINCE_DEPARTMENT) &&
                                   task.assignedToDepartmentIds?.includes(userDepartmentId));

  // Combine assignee checks
  const isAssignee = isDirectAssignee || isDepartmentAssignee;

  // --- Define Permissions Based on Roles and Relationship ---

  // Admin / Leadership have full permissions
  if (userRole === 'admin' || userRole === 'leadership') {
    return {
      canView: true,
      canEdit: true,
      canDelete: true,
      canCancel: true,
      canChangePriority: true,
      canUpdateStatus: true,
      canDelegate: true,
    };
  }

  // --- Permissions for Regular Users / Department Heads --- 
  const permissions: TaskPermissions = {
    canView: isCreator || isAssignee || isDeptHeadOfAssignedDept, // Can view if creator, assignee, or head of assigned dept
    canEdit: isCreator, // Only creator can edit task content/assignees
    canDelete: isCreator, // Only creator can delete
    canCancel: isCreator, // Only creator can cancel
    canChangePriority: isAssignee, // Only assignees (direct or via dept) can change priority
    canUpdateStatus: isAssignee, // Only assignees can update status
    canDelegate: isAssignee || isDeptHeadOfAssignedDept, // Assignees or Head of assigned dept can delegate
  };

  return permissions;
}; 