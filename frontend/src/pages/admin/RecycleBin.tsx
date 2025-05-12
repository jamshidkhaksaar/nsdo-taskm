import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  Button,
  IconButton,
  Chip,
  Tooltip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Grid,
  CircularProgress,
  SelectChangeEvent,
} from '@mui/material';
import { 
  Delete as DeleteIcon, 
  Restore as RestoreIcon, 
  Search as SearchIcon, 
  FilterList as FilterListIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';
import axios from 'axios';
import { UserRole } from '../../types/user';
import { useNavigate } from 'react-router-dom';
import ModernDashboardLayout from '../../components/dashboard/ModernDashboardLayout';
import Sidebar from '../../components/Sidebar';
import DashboardTopBar from '../../components/dashboard/DashboardTopBar';
import { useNotificationContext } from '../../context/NotificationContext';

const DRAWER_WIDTH = 240;

interface DeletedTask {
  id: string;
  title: string;
  description: string;
  deletedAt: string;
  deletionReason: string;
  createdBy: {
    id: string;
    username: string;
  };
  deletedBy: {
    id: string;
    username: string;
  };
  assignedToUsers: {
    id: string;
    username: string;
  }[];
  assignedToDepartments: {
    id: string;
    name: string;
  }[];
  assignedToProvince: {
    id: string;
    name: string;
  } | null;
}

interface Department {
  id: string;
  name: string;
}

interface Province {
  id: string;
  name: string;
}

interface User {
  id: string;
  username: string;
}

// Function to format date in a human-readable way
const formatRelativeTime = (date: Date): string => {
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  
  // Convert to seconds, minutes, hours, days
  const diffInSecs = Math.floor(diffInMs / 1000);
  const diffInMins = Math.floor(diffInSecs / 60);
  const diffInHours = Math.floor(diffInMins / 60);
  const diffInDays = Math.floor(diffInHours / 24);
  
  if (diffInSecs < 60) return 'just now';
  if (diffInMins < 60) return `${diffInMins} ${diffInMins === 1 ? 'minute' : 'minutes'} ago`;
  if (diffInHours < 24) return `${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'} ago`;
  if (diffInDays < 30) return `${diffInDays} ${diffInDays === 1 ? 'day' : 'days'} ago`;
  
  // For older dates, use a more formal format
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

const RecycleBin: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);
  const { unreadCount } = useSelector((state: RootState) => state.notifications);
  const { handleNotificationBellClick } = useNotificationContext();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  const [deletedTasks, setDeletedTasks] = useState<DeletedTask[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [searchText, setSearchText] = useState<string>('');
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [openRestoreDialog, setOpenRestoreDialog] = useState<boolean>(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState<boolean>(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [filterOpen, setFilterOpen] = useState<boolean>(false);
  const [filters, setFilters] = useState({
    userId: '',
    departmentId: '',
    provinceId: '',
    deletedByUserId: '',
    fromDate: '',
    toDate: '',
  });

  const isAdmin = user?.role === UserRole.ADMIN;

  // Redirect if not an authorized role
  useEffect(() => {
    if (user && user.role) {
      const upperCaseRole = user.role.toUpperCase();
      if (!["ADMINISTRATOR", "LEADERSHIP", "SUPER ADMIN"].includes(upperCaseRole)) {
        console.warn(`[RecycleBin] User role '${user.role}' not authorized. Redirecting to dashboard.`);
        navigate('/dashboard');
      }
    } else if (!user) {
      // If user object is null (e.g., not logged in), also redirect
      navigate('/login'); 
    }
  }, [user, navigate]);

  // Wrap fetch functions in useCallback
  const fetchDeletedTasks = useCallback(async () => {
    setLoading(true);
    try {
      // Build query params
      const params = new URLSearchParams();
      if (searchText) params.append('search', searchText);
      if (filters.userId) params.append('userId', filters.userId);
      if (filters.departmentId) params.append('departmentId', filters.departmentId);
      if (filters.provinceId) params.append('provinceId', filters.provinceId);
      if (filters.deletedByUserId) params.append('deletedByUserId', filters.deletedByUserId);
      if (filters.fromDate) params.append('fromDate', filters.fromDate);
      if (filters.toDate) params.append('toDate', filters.toDate);
      params.append('page', (page + 1).toString());
      params.append('limit', rowsPerPage.toString());
      
      const response = await axios.get(`/api/v1/tasks/recycle-bin?${params.toString()}`);
      setDeletedTasks(response.data[0]);
      setTotalCount(response.data[1]);
    } catch (error) {
      console.error('Failed to fetch deleted tasks:', error);
    } finally {
      setLoading(false);
    }
  }, [searchText, filters, page, rowsPerPage]);

  const fetchDepartments = useCallback(async () => {
    try {
      const response = await axios.get('/api/v1/departments');
      setDepartments(response.data);
    } catch (error) {
      console.error('Failed to fetch departments:', error);
    }
  }, [setDepartments]);

  const fetchProvinces = useCallback(async () => {
    try {
      const response = await axios.get('/api/v1/provinces');
      setProvinces(response.data);
    } catch (error) {
      console.error('Failed to fetch provinces:', error);
    }
  }, [setProvinces]);

  const fetchUsers = useCallback(async () => {
    try {
      const response = await axios.get('/api/v1/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  }, [setUsers]);

  // useEffect now correctly depends on the useCallback-wrapped functions
  useEffect(() => {
    fetchDeletedTasks();
    fetchDepartments();
    fetchProvinces();
    fetchUsers();
  }, [fetchDeletedTasks, fetchDepartments, fetchProvinces, fetchUsers]);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(event.target.value);
    setPage(0);
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleRestoreClick = (taskId: string) => {
    setSelectedTaskId(taskId);
    setOpenRestoreDialog(true);
  };

  const handleDeleteForeverClick = (taskId: string) => {
    setSelectedTaskId(taskId);
    setOpenDeleteDialog(true);
  };

  const confirmRestore = async () => {
    if (!selectedTaskId) return;
    
    try {
      await axios.post(`/api/v1/tasks/${selectedTaskId}/restore`);
      fetchDeletedTasks();
      setOpenRestoreDialog(false);
    } catch (error) {
      console.error('Failed to restore task:', error);
    }
  };

  const confirmDeleteForever = async () => {
    if (!selectedTaskId) return;
    
    try {
      await axios.delete(`/api/v1/tasks/${selectedTaskId}/permanent`);
      fetchDeletedTasks();
      setOpenDeleteDialog(false);
    } catch (error) {
      console.error('Failed to permanently delete task:', error);
    }
  };

  const handleSelectChange = (event: SelectChangeEvent<string>) => {
    const { name, value } = event.target;
    setFilters({
      ...filters,
      [name as string]: value,
    });
    setPage(0);
  };

  const handleTextFieldChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFilters({
      ...filters,
      [name as string]: value,
    });
    setPage(0);
  };

  const handleToggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleLogout = () => {
    // Actual logout logic should be dispatched via authSlice
    navigate('/login');
  };

  const handleProfileClick = () => {
    navigate('/profile');
  };

  const handleSettingsClick = () => {
    navigate('/admin/settings');
  };

  const handleHelpClick = () => {
    // Handle help
  };

  const resetFilters = () => {
    setFilters({
      userId: '',
      departmentId: '',
      provinceId: '',
      deletedByUserId: '',
      fromDate: '',
      toDate: '',
    });
    setSearchText('');
    setPage(0);
  };

  const renderContent = () => {
    return (
      <Box sx={{ p: 2 }}>
        <Typography variant="h4" gutterBottom sx={{ color: 'white', mb: 3 }}>
          Recycle Bin
        </Typography>
        
        <Paper sx={{ 
          mb: 4, 
          p: 3, 
          borderRadius: '12px', 
          backgroundColor: 'rgba(255, 255, 255, 0.15)', // Semi-transparent background
          backdropFilter: 'blur(10px)', // Blur effect
          border: '1px solid rgba(255, 255, 255, 0.2)', // Subtle border
          boxShadow: 3 // Optional shadow for depth
        }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                label="Search Tasks"
                variant="outlined"
                fullWidth
                value={searchText}
                onChange={handleSearchChange}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ color: 'action.active', mr: 1 }} />,
                  endAdornment: searchText && (
                    <IconButton size="small" onClick={() => setSearchText('')}>
                      <ClearIcon />
                    </IconButton>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={6} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button 
                variant="outlined" 
                startIcon={<FilterListIcon />}
                onClick={() => setFilterOpen(!filterOpen)}
                sx={{ mr: 1 }}
              >
                Filters
              </Button>
              <Button 
                variant="outlined" 
                color="secondary"
                startIcon={<ClearIcon />}
                onClick={resetFilters}
                disabled={!Object.values(filters).some(value => value !== '')}
              >
                Reset
              </Button>
            </Grid>
            
            {filterOpen && (
              <Grid item xs={12}>
                <Box sx={{ p: 2, mt: 2, border: '1px solid #e0e0e0', borderRadius: '8px' }}>
                  <Typography variant="subtitle1" gutterBottom>Advanced Filters</Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={4}>
                      <FormControl fullWidth>
                        <InputLabel>Created By</InputLabel>
                        <Select
                          name="userId"
                          value={filters.userId}
                          label="Created By"
                          onChange={handleSelectChange}
                        >
                          <MenuItem value="">All</MenuItem>
                          {users.map((user) => (
                            <MenuItem key={user.id} value={user.id}>{user.username}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <FormControl fullWidth>
                        <InputLabel>Department</InputLabel>
                        <Select
                          name="departmentId"
                          value={filters.departmentId}
                          label="Department"
                          onChange={handleSelectChange}
                        >
                          <MenuItem value="">All</MenuItem>
                          {departments.map((dept) => (
                            <MenuItem key={dept.id} value={dept.id}>{dept.name}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <FormControl fullWidth>
                        <InputLabel>Province</InputLabel>
                        <Select
                          name="provinceId"
                          value={filters.provinceId}
                          label="Province"
                          onChange={handleSelectChange}
                        >
                          <MenuItem value="">All</MenuItem>
                          {provinces.map((prov) => (
                            <MenuItem key={prov.id} value={prov.id}>{prov.name}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <FormControl fullWidth>
                        <InputLabel>Deleted By</InputLabel>
                        <Select
                          name="deletedByUserId"
                          value={filters.deletedByUserId}
                          label="Deleted By"
                          onChange={handleSelectChange}
                        >
                          <MenuItem value="">All</MenuItem>
                          {users.map((user) => (
                            <MenuItem key={user.id} value={user.id}>{user.username}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField
                        name="fromDate"
                        label="From Date"
                        type="date"
                        fullWidth
                        value={filters.fromDate}
                        onChange={handleTextFieldChange}
                        InputLabelProps={{ shrink: true }}
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField
                        name="toDate"
                        label="To Date"
                        type="date"
                        fullWidth
                        value={filters.toDate}
                        onChange={handleTextFieldChange}
                        InputLabelProps={{ shrink: true }}
                      />
                    </Grid>
                  </Grid>
                </Box>
              </Grid>
            )}
          </Grid>
        </Paper>
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {deletedTasks.length === 0 ? (
              <Paper sx={{ 
                p: 4, 
                textAlign: 'center', 
                borderRadius: '12px', 
                backgroundColor: 'rgba(255, 255, 255, 0.15)', // Semi-transparent background
                backdropFilter: 'blur(10px)', // Blur effect
                border: '1px solid rgba(255, 255, 255, 0.2)', // Subtle border
                boxShadow: 3 // Optional shadow for depth
              }}>
                <Typography variant="h6">No deleted tasks found</Typography>
                <Typography variant="body2" color="textSecondary">
                  When tasks are deleted with a reason, they will appear here
                </Typography>
              </Paper>
            ) : (
              <>
                <TableContainer component={Paper} sx={{ 
                  borderRadius: '12px', 
                  backgroundColor: 'rgba(255, 255, 255, 0.15)', // Semi-transparent background
                  backdropFilter: 'blur(10px)', // Blur effect
                  border: '1px solid rgba(255, 255, 255, 0.2)', // Subtle border
                  boxShadow: 3 // Optional shadow for depth
                }}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Task Title</TableCell>
                        <TableCell>Created By</TableCell>
                        <TableCell>Deleted By</TableCell>
                        <TableCell>Deleted</TableCell>
                        <TableCell>Reason</TableCell>
                        <TableCell>Assignees</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {deletedTasks.map((task) => (
                        <TableRow key={task.id}>
                          <TableCell>
                            <Tooltip title={task.description} arrow>
                              <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                {task.title}
                              </Typography>
                            </Tooltip>
                          </TableCell>
                          <TableCell>{task.createdBy?.username || 'Unknown'}</TableCell>
                          <TableCell>{task.deletedBy?.username || 'Unknown'}</TableCell>
                          <TableCell>
                            {task.deletedAt ? formatRelativeTime(new Date(task.deletedAt)) : 'Unknown'}
                          </TableCell>
                          <TableCell>
                            <Tooltip title={task.deletionReason} arrow>
                              <Typography 
                                variant="body2" 
                                sx={{ 
                                  maxWidth: '200px', 
                                  overflow: 'hidden', 
                                  textOverflow: 'ellipsis', 
                                  whiteSpace: 'nowrap' 
                                }}
                              >
                                {task.deletionReason || 'No reason provided'}
                              </Typography>
                            </Tooltip>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                              {task.assignedToUsers.map((user) => (
                                <Chip key={user.id} label={user.username} size="small" />
                              ))}
                              {task.assignedToDepartments.map((dept) => (
                                <Chip key={dept.id} label={dept.name} size="small" variant="outlined" />
                              ))}
                              {task.assignedToProvince && (
                                <Chip label={task.assignedToProvince.name} size="small" variant="outlined" color="secondary" />
                              )}
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Tooltip title="Restore Task">
                              <IconButton onClick={() => handleRestoreClick(task.id)} color="primary">
                                <RestoreIcon />
                              </IconButton>
                            </Tooltip>
                            {isAdmin && (
                              <Tooltip title="Delete Forever">
                                <IconButton onClick={() => handleDeleteForeverClick(task.id)} color="error">
                                  <DeleteIcon />
                                </IconButton>
                              </Tooltip>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                <TablePagination
                  rowsPerPageOptions={[5, 10, 25]}
                  component="div"
                  count={totalCount}
                  rowsPerPage={rowsPerPage}
                  page={page}
                  onPageChange={handleChangePage}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                  sx={{ color: 'white' }}
                />
              </>
            )}
          </>
        )}
        
        {/* Restore Dialog */}
        <Dialog open={openRestoreDialog} onClose={() => setOpenRestoreDialog(false)}>
          <DialogTitle>Restore Task</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Are you sure you want to restore this task? It will be moved back to pending status.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenRestoreDialog(false)}>Cancel</Button>
            <Button onClick={confirmRestore} color="primary" variant="contained">
              Restore
            </Button>
          </DialogActions>
        </Dialog>
        
        {/* Delete Forever Dialog */}
        <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
          <DialogTitle>Delete Task Permanently</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Warning: This action cannot be undone. The task will be permanently deleted from the system.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDeleteDialog(false)}>Cancel</Button>
            <Button onClick={confirmDeleteForever} color="error" variant="contained">
              Delete Forever
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    );
  };

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
          username={user?.username || 'User'}
          notificationCount={unreadCount}
          onToggleSidebar={handleToggleSidebar}
          onNotificationClick={handleNotificationBellClick}
          onProfileClick={handleProfileClick}
          onSettingsClick={handleSettingsClick} 
          onHelpClick={handleHelpClick}
          onLogout={handleLogout}
          onToggleTopWidgets={() => {}}
          topWidgetsVisible={true}
        />
      }
      mainContent={renderContent()}
      sidebarOpen={isSidebarOpen}
      drawerWidth={DRAWER_WIDTH}
    />
  );
};

export default RecycleBin; 