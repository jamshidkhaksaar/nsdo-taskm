import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { Task, TaskType } from '../types/task';
import { User } from '../types/user'; // Import User type if needed for department head check

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

  // User details
  const userId = user.id?.toString();
  const userRole = user.role || 'user';
  const userDepartmentId = user.department?.id; // Assuming user object from authSlice has department populated

  // Task details
  const isCreator = task.createdById?.toString() === userId;

  // Check direct user assignment
  const isDirectAssignee = task.assignedToUsers?.some(u => u.id?.toString() === userId) ||
                           task.assigned_to?.includes(userId) || // Fallback check on assigned_to
                           false;

  // Check department assignment (if user belongs to assigned department)
  const isDepartmentAssignee = (task.type === TaskType.DEPARTMENT || task.type === TaskType.PROVINCE_DEPARTMENT) &&
                               userDepartmentId &&
                               task.assignedToDepartmentIds?.includes(userDepartmentId) ||
                               false;

  // Check if user is a Department Head for an assigned department
  // NOTE: This requires logic to identify Dept Heads, maybe role === 'department_head' AND user.departmentId is in task.assignedToDepartmentIds
  const isDeptHeadOfAssignedDept = userRole === 'department_head' && // Simple role check for now
                                   userDepartmentId &&
                                   (task.type === TaskType.DEPARTMENT || task.type === TaskType.PROVINCE_DEPARTMENT) &&
                                   task.assignedToDepartmentIds?.includes(userDepartmentId) ||
                                   false;

  // Combine assignee checks
  const isAssignee = isDirectAssignee || isDepartmentAssignee;

  // --- Define Permissions Based on Roles and Relationship ---

  // Admin / General Manager have full permissions
  if (userRole === 'admin' || userRole === 'general_manager') {
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