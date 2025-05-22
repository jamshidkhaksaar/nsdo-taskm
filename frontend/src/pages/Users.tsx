import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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
  Pagination,
  Stack,
  Paper,
} from '@mui/material';
import { User } from '../types/user';
import * as UserService from '../services/users.service';
import { TaskService } from '../services/task';
import Sidebar from '../components/Sidebar';
import ModernDashboardLayout from '../components/dashboard/ModernDashboardLayout';
import DashboardTopBar from '../components/dashboard/DashboardTopBar';
import UserList from '../components/users/UserList';
import { RootState } from '@/store';
import { Page, PageOptions, Order } from '../types/page';
import { useDebounce } from '../hooks/useDebounce';
import SelectExistingTaskDialog from '../components/dialogs/SelectExistingTaskDialog';
import CreateTaskDialog from '../components/dialogs/CreateTaskDialog';

const DRAWER_WIDTH = 240;
const DEFAULT_TAKE = 10;

const Users: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  const [taskIdToAssign, setTaskIdToAssign] = useState<string | null>(null);

  useEffect(() => {
    if (location.state && location.state.taskId) {
      setTaskIdToAssign(location.state.taskId);
      console.log('Task ID from location state:', location.state.taskId);
    } else {
      console.log('No Task ID found in location state for assignment.');
    }
  }, [location.state]);

  const [internalSearchTerm, setInternalSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(internalSearchTerm, 500);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(DEFAULT_TAKE);

  const { user: currentUser } = useSelector((state: RootState) => state.auth);
  const [notifications] = useState(3);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [selectedUserIdsArray, setSelectedUserIdsArray] = useState<string[]>([]);
  const [isAssigning, setIsAssigning] = useState(false);
  const [assignmentError, setAssignmentError] = useState<string | null>(null);

  const [assignTaskDialogOpen, setAssignTaskDialogOpen] = useState(false);
  const [userToAssignTask, setUserToAssignTask] = useState<User | null>(null);

  const [createTaskDialogOpen, setCreateTaskDialogOpen] = useState(false);

  const pageOptions: PageOptions = {
    page: currentPage,
    take: itemsPerPage,
    q: debouncedSearchTerm,
    order: Order.ASC,
  };

  const usersQuery = useQuery<Page<User>, Error>({
    queryKey: ['users', pageOptions],
    queryFn: () => UserService.getUsers(pageOptions),
    staleTime: 5 * 60 * 1000,
    placeholderData: (previousData) => previousData,
  });

  const deleteUserMutation = useQueryClient().getMutationCache().find({ mutationKey: ['deleteUser'] });

  const handleLogout = () => navigate('/login');
  const handleToggleSidebar = useCallback(() => setIsSidebarOpen(prev => !prev), []);

  const handleAssignSelectedUsers = async () => {
    if (!taskIdToAssign) {
      alert('No task context for assignment. Please ensure you navigated from a task.');
      return;
    }
    if (selectedUserIdsArray.length > 0) {
      setIsAssigning(true);
      setAssignmentError(null);
      try {
        console.log(`Assigning task ${taskIdToAssign} to user IDs:`, selectedUserIdsArray);
        await TaskService.updateTask(taskIdToAssign, { assignedToUserIds: selectedUserIdsArray });
        alert(`Successfully assigned task to selected users!`);
        queryClient.invalidateQueries({ queryKey: ['task', taskIdToAssign] });
        queryClient.invalidateQueries({ queryKey: ['tasks'] });
        setSelectedUserIdsArray([]);
      } catch (error: any) {
        const errorMessage = error.response?.data?.message || error.message || 'Failed to assign users. Please try again.';
        console.error("Failed to assign users to task:", errorMessage, error);
        setAssignmentError(errorMessage);
      } finally {
        setIsAssigning(false);
      }
    } else {
      alert('Please select at least one user to assign.');
    }
  };

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setCurrentPage(value);
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm]);

  useEffect(() => {
    console.log('Selected User IDs (from Users.tsx effect):', selectedUserIdsArray);
  }, [selectedUserIdsArray]);

  const isLoading = usersQuery.isLoading;
  const queryError = usersQuery.error;
  const usersData = usersQuery.data?.data || [];
  const pageMeta = usersQuery.data?.meta;

  const mainContent = (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" fontWeight="bold" color="text.primary">
          {taskIdToAssign ? 'Select Users to Assign' : 'User Management'}
        </Typography>
        {taskIdToAssign && (
          <Button 
            variant="contained" 
            color="primary"
            onClick={handleAssignSelectedUsers}
            disabled={selectedUserIdsArray.length === 0 || isLoading || isAssigning}
          >
            {isAssigning ? <CircularProgress size={24} color="inherit" /> : `Assign to Task (${selectedUserIdsArray.length})`}
          </Button>
        )}
        {!taskIdToAssign && selectedUserIdsArray.length > 0 && (
          <Button 
            variant="contained" 
            color="secondary" 
            onClick={() => setCreateTaskDialogOpen(true)}
            disabled={isLoading || isAssigning}
            sx={{ ml: 2 }}
          >
            Create & Assign Task ({selectedUserIdsArray.length})
          </Button>
        )}
      </Box>
      
      {assignmentError && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setAssignmentError(null)}>
          {assignmentError}
        </Alert>
      )}

      <Paper elevation={2} sx={{p: 2, mb: 2, background: 'rgba(255, 255, 255, 0.05)', backdropFilter: 'blur(5px)'}}>
        <UserList
          users={usersData}
          searchQuery={internalSearchTerm}
          onSearchChange={setInternalSearchTerm}
          selectedUserIds={selectedUserIdsArray}
          onSelectedUsersChange={setSelectedUserIdsArray}
          title={taskIdToAssign ? "Select Users to Assign" : "Available Users"}
        />
      </Paper>

      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <CircularProgress />
        </Box>
      )}
      {!isLoading && queryError && (
        <Alert severity="error" sx={{ my: 2 }}>
          {queryError.message || 'An error occurred loading users.'}
        </Alert>
      )}
      {!isLoading && !queryError && usersData.length === 0 && !debouncedSearchTerm && (
         <Typography sx={{textAlign: 'center', my: 2, color: 'text.secondary'}}>
            No users found.
        </Typography>
      )}
       {!isLoading && !queryError && usersData.length === 0 && debouncedSearchTerm && (
         <Typography sx={{textAlign: 'center', my: 2, color: 'text.secondary'}}>
            No users match your search "{debouncedSearchTerm}".
        </Typography>
      )}

      {pageMeta && pageMeta.pageCount > 1 && !isLoading && !queryError && (
        <Stack spacing={2} sx={{ mt: 3, mb:2, alignItems: 'center' }}>
          <Pagination
            count={pageMeta.pageCount}
            page={currentPage}
            onChange={handlePageChange}
            color="primary"
            sx={{ 
              '& .MuiPaginationItem-root': {
                color: 'rgba(255,255,255,0.8)'
              },
              '& .Mui-selected': {
                backgroundColor: 'rgba(100,180,255,0.3)'
              }
            }}
          />
        </Stack>
      )}

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>{"Confirm Deletion"}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete user "{userToDelete?.username}"?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={() => userToDelete && console.log('Delete user:', userToDelete.id)}
            color="error"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <SelectExistingTaskDialog 
        open={assignTaskDialogOpen} 
        onClose={() => setAssignTaskDialogOpen(false)} 
        user={userToAssignTask}
      />

      <CreateTaskDialog 
        open={createTaskDialogOpen}
        onClose={() => setCreateTaskDialogOpen(false)}
        assignedUserIds={selectedUserIdsArray}
      />

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
          onToggleTopWidgets={() => console.log('Toggle Top Widgets')}
          topWidgetsVisible={true}
        />
      }
      mainContent={mainContent}
      sidebarOpen={isSidebarOpen}
      drawerWidth={DRAWER_WIDTH}
    />
  );
};

export default Users;
