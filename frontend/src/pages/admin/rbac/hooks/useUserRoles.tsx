import { useState } from 'react';
import axios from 'axios';
import { useSnackbar } from 'notistack';
import { User, UserRole } from '../types/index';

export const useUserRoles = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [userRoles, setUserRoles] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { enqueueSnackbar } = useSnackbar();

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get('users');
      setUsers(response.data);
      return response.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch users';
      setError(errorMessage);
      enqueueSnackbar(errorMessage, { variant: 'error' });
      return [];
    } finally {
      setLoading(false);
    }
  };

  const fetchUserRoles = async (userId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`/rbac/users/${userId}/roles`);
      
      // Update the userRoles state with the fetched roles for this user
      setUserRoles(prev => ({
        ...prev,
        [userId]: response.data.map((userRole: UserRole) => userRole.roleId)
      }));
      
      return response.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch user roles';
      setError(errorMessage);
      enqueueSnackbar(errorMessage, { variant: 'error' });
      return [];
    } finally {
      setLoading(false);
    }
  };

  const assignRolesToUser = async (userId: string, roleIds: string[]) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post(`/api/rbac/users/${userId}/roles`, { roleIds });
      
      // Update the userRoles state with the new roles for this user
      setUserRoles(prev => ({
        ...prev,
        [userId]: roleIds
      }));
      
      enqueueSnackbar('Roles assigned successfully', { variant: 'success' });
      return response.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to assign roles to user';
      setError(errorMessage);
      enqueueSnackbar(errorMessage, { variant: 'error' });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const removeRoleFromUser = async (userId: string, roleId: string) => {
    setLoading(true);
    setError(null);
    try {
      await axios.delete(`/api/rbac/users/${userId}/roles/${roleId}`);
      
      // Update the userRoles state by removing this role for the user
      setUserRoles(prev => ({
        ...prev,
        [userId]: (prev[userId] || []).filter(id => id !== roleId)
      }));
      
      enqueueSnackbar('Role removed successfully', { variant: 'success' });
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove role from user';
      setError(errorMessage);
      enqueueSnackbar(errorMessage, { variant: 'error' });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    users,
    userRoles,
    loading,
    error,
    fetchUsers,
    fetchUserRoles,
    assignRolesToUser,
    removeRoleFromUser
  };
};

export default useUserRoles; 