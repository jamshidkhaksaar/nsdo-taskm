import { useState, useCallback } from 'react';
import { useSnackbar } from 'notistack';
import axios from '../../../../utils/axios';
import { Permission, PermissionFormData } from '../types';

export const usePermissions = () => {
  const { enqueueSnackbar } = useSnackbar();
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch permissions from API
  const fetchPermissions = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get('/admin/rbac/permissions');
      setPermissions(response.data);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching permissions:', err);
      setError('Failed to load permissions: ' + (err.response?.data?.message || err.message));
      enqueueSnackbar('Failed to load permissions', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [enqueueSnackbar, setLoading, setPermissions, setError]);

  // Create or update permission
  const savePermission = useCallback(async (permissionData: PermissionFormData, editingPermission: Permission | null) => {
    try {
      setLoading(true);
      if (!permissionData.name.trim()) {
        setError('Permission name is required');
        return false;
      }

      if (editingPermission) {
        // Update existing permission
        const response = await axios.put(`/admin/rbac/permissions/${editingPermission.id}`, permissionData);
        setPermissions(permissions.map(p => p.id === editingPermission.id ? response.data : p));
        enqueueSnackbar('Permission updated successfully', { variant: 'success' });
      } else {
        // Create new permission
        const response = await axios.post('/admin/rbac/permissions', permissionData);
        setPermissions([...permissions, response.data]);
        enqueueSnackbar('Permission created successfully', { variant: 'success' });
      }
      return true;
    } catch (err: any) {
      console.error('Error creating/updating permission:', err);
      setError('Failed to save permission: ' + (err.response?.data?.message || err.message));
      enqueueSnackbar('Failed to save permission', { variant: 'error' });
      return false;
    } finally {
      setLoading(false);
    }
  }, [permissions, enqueueSnackbar, setLoading, setPermissions, setError]);

  // Delete permission
  const deletePermission = useCallback(async (permissionId: string) => {
    try {
      setLoading(true);
      await axios.delete(`/admin/rbac/permissions/${permissionId}`);
      setPermissions(permissions.filter(p => p.id !== permissionId));
      enqueueSnackbar('Permission deleted successfully', { variant: 'success' });
      return true;
    } catch (err: any) {
      console.error('Error deleting permission:', err);
      setError('Failed to delete permission: ' + (err.response?.data?.message || err.message));
      enqueueSnackbar('Failed to delete permission', { variant: 'error' });
      return false;
    } finally {
      setLoading(false);
    }
  }, [permissions, enqueueSnackbar, setLoading, setPermissions, setError]);

  // Initialize system with default roles and permissions
  const initializeRbac = useCallback(async () => {
    try {
      setLoading(true);
      await axios.post('/admin/rbac/init');
      enqueueSnackbar('RBAC system initialized successfully', { variant: 'success' });
      return true;
    } catch (err: any) {
      console.error('Error initializing RBAC:', err);
      setError('Failed to initialize RBAC: ' + (err.response?.data?.message || err.message));
      enqueueSnackbar('Failed to initialize RBAC', { variant: 'error' });
      return false;
    } finally {
      setLoading(false);
    }
  }, [enqueueSnackbar, setLoading, setError]);

  // Migrate existing users to RBAC system
  const migrateToRbac = useCallback(async () => {
    try {
      setLoading(true);
      await axios.post('/admin/rbac/migrate');
      enqueueSnackbar('User migration to RBAC completed successfully', { variant: 'success' });
      return true;
    } catch (err: any) {
      console.error('Error migrating to RBAC:', err);
      setError('Failed to migrate users: ' + (err.response?.data?.message || err.message));
      enqueueSnackbar('Failed to migrate users', { variant: 'error' });
      return false;
    } finally {
      setLoading(false);
    }
  }, [enqueueSnackbar, setLoading, setError]);

  return {
    permissions,
    loading,
    error,
    fetchPermissions,
    savePermission,
    deletePermission,
    initializeRbac,
    migrateToRbac,
    setError
  };
};

export default usePermissions; 