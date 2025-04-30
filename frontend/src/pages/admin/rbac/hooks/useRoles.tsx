import { useState } from 'react';
import axios from 'axios';
import { useSnackbar } from 'notistack';
import { Role, RoleFormData } from '../types';

export const useRoles = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { enqueueSnackbar } = useSnackbar();

  const fetchRoles = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get('/api/rbac/roles');
      setRoles(response.data);
      return response.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch roles';
      setError(errorMessage);
      enqueueSnackbar(errorMessage, { variant: 'error' });
      return [];
    } finally {
      setLoading(false);
    }
  };

  const createRole = async (data: RoleFormData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post('/api/rbac/roles', data);
      setRoles([...roles, response.data]);
      enqueueSnackbar('Role created successfully', { variant: 'success' });
      return response.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create role';
      setError(errorMessage);
      enqueueSnackbar(errorMessage, { variant: 'error' });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateRole = async (id: string, data: RoleFormData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.patch(`/api/rbac/roles/${id}`, data);
      setRoles(
        roles.map((role) => (role.id === id ? response.data : role))
      );
      enqueueSnackbar('Role updated successfully', { variant: 'success' });
      return response.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update role';
      setError(errorMessage);
      enqueueSnackbar(errorMessage, { variant: 'error' });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteRole = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      await axios.delete(`/api/rbac/roles/${id}`);
      setRoles(roles.filter((role) => role.id !== id));
      enqueueSnackbar('Role deleted successfully', { variant: 'success' });
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete role';
      setError(errorMessage);
      enqueueSnackbar(errorMessage, { variant: 'error' });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const assignPermissionsToRole = async (roleId: string, permissionIds: string[]) => {
    setLoading(true);
    setError(null);
    try {
      const payload = { permissionIds };
      const response = await axios.post(`/api/rbac/roles/${roleId}/permissions`, payload);
      
      // Update the permissions for this role in the local state
      setRoles(
        roles.map((role) => (role.id === roleId ? response.data : role))
      );
      
      enqueueSnackbar('Permissions assigned successfully', { variant: 'success' });
      return response.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to assign permissions';
      setError(errorMessage);
      enqueueSnackbar(errorMessage, { variant: 'error' });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    roles,
    loading,
    error,
    fetchRoles,
    createRole,
    updateRole,
    deleteRole,
    assignPermissionsToRole
  };
};

export default useRoles; 