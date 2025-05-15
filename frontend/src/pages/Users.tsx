import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Container,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';
import { User } from '../types/user';
import { UserService } from '../services/user';
import Sidebar from '../components/Sidebar';
import ModernDashboardLayout from '../components/dashboard/ModernDashboardLayout';
import DashboardTopBar from '../components/dashboard/DashboardTopBar';
import UserList from '../components/users/UserList';
import { RootState } from '@/store';

const DRAWER_WIDTH = 240;

const Users: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // User state
  const [searchTerm, setSearchTerm] = useState('');
  const { user: currentUser } = useSelector((state: RootState) => state.auth);
  const [notifications] = useState(3);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [topWidgetsVisible, setTopWidgetsVisible] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  // New state for managing multiple selected user IDs
  const [selectedUserIdsArray, setSelectedUserIdsArray] = useState<string[]>([]);

  // React Query for Users
  const usersQuery = useQuery<User[]>({
    queryKey: ['users', searchTerm],
    queryFn: () => searchTerm ? UserService.searchUsers(searchTerm) : UserService.getUsers(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const deleteUserMutation = useMutation({
    mutationFn: UserService.deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setDeleteDialogOpen(false);
      setUserToDelete(null);
    },
    onError: (error: any) => {
      console.error("Error deleting user:", error);
    },
  });

  const handleLogout = () => {
    navigate('/login');
  };

  const handleToggleSidebar = useCallback(() => {
    setIsSidebarOpen(prev => !prev);
  }, []);

  const handleToggleTopWidgets = useCallback(() => {
    setTopWidgetsVisible(prev => !prev);
  }, []);

  const isLoading = usersQuery.isLoading;
  const combinedError = usersQuery.error;

  const mainContent = (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" color="#fff">
          Select Users
        </Typography>
      </Box>

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}>
          <CircularProgress />
        </Box>
      ) : combinedError ? (
        <Alert severity="error" sx={{ m: 3 }}>
          {combinedError.message || 'An error occurred loading data.'}
        </Alert>
      ) : (
        <UserList
          users={usersQuery.data || []}
          searchQuery={searchTerm}
          onSearchChange={(query: string) => setSearchTerm(query)}
          selectedUserIds={selectedUserIdsArray}
          onSelectedUsersChange={(ids: string[]) => setSelectedUserIdsArray(ids)}
          selectedUser={null}
          onSelectUser={() => {}}
        />
      )}

      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">{"Confirm Deletion"}</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Are you sure you want to delete the user "{userToDelete?.username}"? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} color="primary">
            Cancel
          </Button>
          <Button onClick={() => deleteUserMutation.mutate(userToDelete?.id || '')} color="error" autoFocus disabled={deleteUserMutation.isPending}>
            {deleteUserMutation.isPending ? <CircularProgress size={20} /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

    </Container>
  );

  return (
    <ModernDashboardLayout
      sidebar={
        <Sidebar
          open={isSidebarOpen}
          onToggleDrawer={handleToggleSidebar}
          onLogout={handleLogout}
          drawerWidth={DRAWER_WIDTH}
        />
      }
      topBar={
        <DashboardTopBar
          username={currentUser?.username || 'User'}
          notificationCount={notifications}
          onToggleSidebar={handleToggleSidebar}
          onNotificationClick={() => console.log('Notifications')}
          onLogout={handleLogout}
          onProfileClick={() => navigate('/profile')}
          onSettingsClick={() => navigate('/settings')}
          onHelpClick={() => console.log('Help')}
          onToggleTopWidgets={handleToggleTopWidgets}
          topWidgetsVisible={topWidgetsVisible}
        />
      }
      mainContent={mainContent}
      sidebarOpen={isSidebarOpen}
      drawerWidth={DRAWER_WIDTH}
    />
  );
};

export default Users;
