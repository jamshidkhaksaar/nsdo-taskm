import { User, Department } from '@/types/index';

/**
 * Get display name for a user, preferring full name over username
 * Since the backend only has username field, we'll use that as the display name
 */
export const getUserDisplayName = (user: User | { username?: string; id: string } | null | undefined): string => {
  if (!user) return 'Unknown User';
  
  // For now, use username as the display name since we don't have separate first/last name fields
  return user.username || `User (${user.id.substring(0, 6)}...)`;
};

/**
 * Get display name for a user by ID from a cache or fallback to ID
 */
export const getUserDisplayNameById = (userId: string | undefined, userCache: Record<string, string> = {}): string => {
  if (!userId) return 'Unknown User';
  return userCache[userId] || `User (${userId.substring(0, 6)}...)`;
};

/**
 * Get department names for a user
 */
export const getUserDepartmentNames = (user: User | null | undefined): string[] => {
  if (!user || !user.departments) return [];
  return user.departments.map(dept => dept.name);
};

/**
 * Format assignee display according to requirements:
 * - Show full name, or if assigned to department, show "Assigned To Department [Department Name]"
 */
export const formatAssigneeDisplay = (
  task: any,
  currentUser?: any | null
): string => {
  if (!task) return 'Unassigned';

  // If it's a personal task
  if (task.type === 'personal') {
    if (task.createdBy && task.createdBy.id === currentUser?.id) {
      return 'My Personal Task';
    }
    return task.createdBy ? getUserDisplayName(task.createdBy) : 'Personal Task';
  }

  // If assigned to specific users
  if (task.assignedToUsers && task.assignedToUsers.length > 0) {
    if (task.assignedToUsers.length === 1) {
      const assignee = task.assignedToUsers[0];
      const displayName = getUserDisplayName(assignee);
      
      // Check if the assignee is a member of a department and show that info
      if (assignee.departments && assignee.departments.length > 0) {
        const deptNames = assignee.departments.map((d: Department) => d.name).join(', ');
        return `${displayName} (${deptNames})`;
      }
      
      return displayName;
    } else {
      // Multiple users assigned
      const firstUser = getUserDisplayName(task.assignedToUsers[0]);
      return `${firstUser} + ${task.assignedToUsers.length - 1} more`;
    }
  }

  // If assigned to departments
  if (task.assignedToDepartments && task.assignedToDepartments.length > 0) {
    if (task.assignedToDepartments.length === 1) {
      return `Assigned To Department (${task.assignedToDepartments[0].name})`;
    } else {
      const deptNames = task.assignedToDepartments.map((d: Department) => d.name).join(', ');
      return `Assigned To Departments (${deptNames})`;
    }
  }

  // If assigned to a province
  if (task.assignedToProvince) {
    return `Assigned To Province (${task.assignedToProvince.name})`;
  }

  return 'Unassigned';
};

/**
 * Format assigner display according to requirements:
 * - Show full name and "member of [Department Name]"
 */
export const formatAssignerDisplay = (task: any): string => {
  if (!task || !task.createdBy) return 'Unknown Creator';

  const creatorName = getUserDisplayName(task.createdBy);
  
  // Add department information if available
  if (task.createdBy.departments && task.createdBy.departments.length > 0) {
    const deptNames = task.createdBy.departments.map((d: Department) => d.name).join(', ');
    return `${creatorName} (member of ${deptNames})`;
  }

  return creatorName;
};

/**
 * Format user display with department info for general use
 */
export const formatUserWithDepartment = (user: User | null | undefined): string => {
  if (!user) return 'Unknown User';
  
  const displayName = getUserDisplayName(user);
  const deptNames = getUserDepartmentNames(user);
  
  if (deptNames.length > 0) {
    return `${displayName} (${deptNames.join(', ')})`;
  }
  
  return displayName;
}; 