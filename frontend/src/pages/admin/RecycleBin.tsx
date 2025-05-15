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
  Snackbar,
  Alert,
} from '@mui/material';
import { 
  Delete as DeleteIcon, 
  Restore as RestoreIcon, 
  Search as SearchIcon, 
  FilterList as FilterListIcon,
  Clear as ClearIcon,
  DeleteSweep as DeleteSweepIcon,
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import axios from 'axios';
import { UserRole, User } from '../../types/user';
import { Task, TaskStatus } from '../../types';
import { TaskService } from '../../services/task';
import { useNavigate } from 'react-router-dom';
import ModernDashboardLayout from '../../components/dashboard/ModernDashboardLayout';
import Sidebar from '../../components/Sidebar';
import DashboardTopBar from '../../components/dashboard/DashboardTopBar';
import { useNotificationContext } from '../../context/NotificationContext';

const DRAWER_WIDTH = 240;

// It's highly recommended to define a specific type for recycled tasks
// if its structure differs significantly or includes extra fields like deletionReason.
interface RecycledTask extends Task {
    deletedAt?: string; // Or Date
    deletionReason?: string;
    deletedBy?: User; // Assuming deletedBy is a User object
}

interface Department {
  id: string;
  name: string;
}

interface Province {
  id: string;
  name: string;
}

interface SnackbarMessage {
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
}

// Function to format date in a human-readable way
const formatRelativeTime = (dateString: string | Date | undefined): string => {
  if (!dateString) return 'N/A';
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  
  const diffInSecs = Math.floor(diffInMs / 1000);
  const diffInMins = Math.floor(diffInSecs / 60);
  const diffInHours = Math.floor(diffInMins / 60);
  const diffInDays = Math.floor(diffInHours / 24);
  
  if (diffInSecs < 60) return 'just now';
  if (diffInMins < 60) return `${diffInMins} ${diffInMins === 1 ? 'minute' : 'minutes'} ago`;
  if (diffInHours < 24) return `${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'} ago`;
  if (diffInDays < 30) return `${diffInDays} ${diffInDays === 1 ? 'day' : 'days'} ago`;
  
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

const RecycleBin: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);
  const { unreadCount } = useSelector((state: RootState) => state.notifications);
  const { handleNotificationBellClick } = useNotificationContext();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  const [deletedTasks, setDeletedTasks] = useState<RecycledTask[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
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

  const [snackbar, setSnackbar] = useState<SnackbarMessage | null>(null);
  const [openConfirmWipeDialog, setOpenConfirmWipeDialog] = useState(false);

  const isAdmin = user?.role === UserRole.ADMIN || user?.role === "Super Admin" || user?.role === "Administrator";

  useEffect(() => {
    if (user && user.role) {
      const upperCaseRole = user.role.toUpperCase();
      if (!["ADMINISTRATOR", "LEADERSHIP", "SUPER ADMIN"].includes(upperCaseRole)) {
        navigate('/dashboard');
      }
    } else if (!user) {
      navigate('/login'); 
    }
  }, [user, navigate]);

  const fetchRecycledTasksData = useCallback(async () => {
    setLoading(true);
    try {
      const queryParams: Record<string, string | number | boolean> = {
        page: page + 1,
        limit: rowsPerPage,
      };
      if (searchText) queryParams.search = searchText;
      if (filters.userId) queryParams.userId = filters.userId;
      if (filters.departmentId) queryParams.departmentId = filters.departmentId;
      if (filters.provinceId) queryParams.provinceId = filters.provinceId;
      if (filters.deletedByUserId) queryParams.deletedByUserId = filters.deletedByUserId;
      if (filters.fromDate) queryParams.fromDate = filters.fromDate;
      if (filters.toDate) queryParams.toDate = filters.toDate;
      
      const result = await TaskService.getRecycledTasks(queryParams);
      setDeletedTasks(result.tasks as RecycledTask[]);
      setTotalCount(result.total);
    } catch (error: any) {
      console.error('Failed to fetch deleted tasks:', error);
      const message = error.message || (error.response?.data?.message) || 'Failed to load recycled tasks.';
      setSnackbar({ message, severity: 'error' });
      setDeletedTasks([]);
      setTotalCount(0);
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
  }, []);

  const fetchProvinces = useCallback(async () => {
    try {
      const response = await axios.get('/api/v1/provinces');
      setProvinces(response.data);
    } catch (error) {
      console.error('Failed to fetch provinces:', error);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const response = await axios.get('/api/v1/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  }, []);

  useEffect(() => {
    fetchRecycledTasksData();
    fetchDepartments();
    fetchProvinces();
    fetchUsers();
  }, [fetchRecycledTasksData, fetchDepartments, fetchProvinces, fetchUsers]);

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
    setIsSubmitting(true);
    try {
      await axios.post(`/api/v1/tasks/${selectedTaskId}/restore`);
      fetchRecycledTasksData();
      setOpenRestoreDialog(false);
      setSnackbar({ message: 'Task restored successfully.', severity: 'success' });
    } catch (error: any) {
      console.error('Failed to restore task:', error);
      setSnackbar({ message: error.response?.data?.message || 'Failed to restore task.', severity: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDeleteForever = async () => {
    if (!selectedTaskId) return;

    if (selectedTaskId.startsWith('invalid-')) {
      setSnackbar({ message: 'Cannot delete task: Invalid task ID.', severity: 'error' });
      setOpenDeleteDialog(false);
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(true);
    try {
      await axios.delete(`/api/v1/tasks/${selectedTaskId}/permanent`);
      fetchRecycledTasksData();
      setOpenDeleteDialog(false);
      setSnackbar({ message: 'Task permanently deleted.', severity: 'success' });
    } catch (error: any) {
      console.error('Failed to permanently delete task:', error);
      setSnackbar({ message: error.response?.data?.message || 'Failed to permanently delete task.', severity: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWipeAllRecycleBin = async () => {
    setOpenConfirmWipeDialog(true);
  };

  const confirmWipeAllRecycleBin = async () => {
    setOpenConfirmWipeDialog(false);
    const verySure = window.prompt('This is IRREVERSIBLE and will permanently delete all tasks currently in the Recycle Bin. To confirm, type DELETE ALL RECYCLED TASKS below:');
    if (verySure === "DELETE ALL RECYCLED TASKS") {
        setIsSubmitting(true);
        try {
            const result = await TaskService.wipeRecycleBin();
            setSnackbar({ message: `Successfully deleted ${result.count} tasks from the Recycle Bin.`, severity: 'success' });
            fetchRecycledTasksData();
        } catch (err: any) {
            const errMsg = err.response?.data?.message || err.message || 'Failed to wipe Recycle Bin.';
            setSnackbar({ message: errMsg, severity: 'error' });
            console.error("Error wiping Recycle Bin:", err);
        } finally {
            setIsSubmitting(false);
        }
    } else {
        setSnackbar({ message: 'Wipe operation cancelled.', severity: 'info' });
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
    navigate('/login');
  };

  const handleProfileClick = () => {
    navigate('/profile');
  };

  const handleSettingsClick = () => {
    navigate('/admin/settings');
  };

  const handleHelpClick = () => { /* Placeholder */ };

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

  const handleCloseSnackbar = () => {
    setSnackbar(null);
  };

  const renderContent = () => {
    return (
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h4" gutterBottom sx={{ color: 'white', mb: 0 }}>
            Recycle Bin
            </Typography>
            {isAdmin && (
                <Button
                    variant="contained"
                    color="error"
                    startIcon={<DeleteSweepIcon />}
                    onClick={handleWipeAllRecycleBin}
                    disabled={loading || isSubmitting || deletedTasks.length === 0}
                    sx={{backdropFilter: 'blur(5px)', background: 'rgba(255, 82, 82, 0.7)', '&:hover': { background: 'rgba(255, 82, 82, 0.9)' }}}
                >
                    {isSubmitting && openConfirmWipeDialog === false ? <CircularProgress size={20} color="inherit" sx={{mr:1}}/> : null}
                    Wipe All From Recycle Bin
                </Button>
            )}
        </Box>
        
        <Paper sx={{ 
          mb: 4, 
          p: 3, 
          borderRadius: '12px', 
          backgroundColor: 'rgba(255, 255, 255, 0.08)', 
          backdropFilter: 'blur(10px)', 
          border: '1px solid rgba(255, 255, 255, 0.1)', 
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
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
                  style: { color: '#e0e0e0' },
                  startAdornment: <SearchIcon sx={{ color: '#9e9e9e', mr: 1 }} />,
                  endAdornment: searchText && (
                    <IconButton size="small" onClick={() => setSearchText('')} sx={{color: '#9e9e9e'}}>
                      <ClearIcon />
                    </IconButton>
                  ),
                }}
                InputLabelProps={{ style: { color: '#b0b0b0' } }}
                sx={{ 
                    "& .MuiOutlinedInput-root": {
                        "& fieldset": { borderColor: "rgba(255,255,255,0.23)" },
                        "&:hover fieldset": { borderColor: "rgba(255,255,255,0.5)" },
                        "&.Mui-focused fieldset": { borderColor: "#fff" },
                    }
                }}
              />
            </Grid>
            <Grid item xs={12} md={6} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button 
                variant="outlined" 
                startIcon={<FilterListIcon />}
                onClick={() => setFilterOpen(!filterOpen)}
                sx={{ mr: 1, color: '#fff', borderColor: 'rgba(255,255,255,0.5)', '&:hover': {borderColor: '#fff'} }}
              >
                Filters
              </Button>
              <Button 
                variant="outlined" 
                color="secondary"
                startIcon={<ClearIcon />}
                onClick={resetFilters}
                disabled={!Object.values(filters).some(value => value !== '') && !searchText}
                sx={{color: '#aaa', borderColor: 'rgba(255,255,255,0.3)', '&:hover': {borderColor: '#fff', color: '#fff'} }}
              >
                Reset
              </Button>
            </Grid>
            
            {filterOpen && (
              <Grid item xs={12}>
                <Box sx={{ p: 2, mt: 2, border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', background: 'rgba(0,0,0,0.1)' }}>
                  <Typography variant="subtitle1" gutterBottom sx={{color: '#fff'}}>Advanced Filters</Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={4}>
                      <FormControl fullWidth variant="outlined">
                        <InputLabel sx={{color: '#b0b0b0'}}>Created By</InputLabel>
                        <Select
                          name="userId"
                          value={filters.userId}
                          label="Created By"
                          onChange={handleSelectChange}
                          sx={{color: '#e0e0e0', "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.23)" }, "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.5)" }, "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#fff" }, "& .MuiSvgIcon-root": { color: '#9e9e9e' }}}
                        >
                          <MenuItem value="">All</MenuItem>
                          {users.map((u) => (
                            <MenuItem key={u.id} value={u.id}>{u.username}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <FormControl fullWidth variant="outlined">
                        <InputLabel sx={{color: '#b0b0b0'}}>Department</InputLabel>
                        <Select
                          name="departmentId"
                          value={filters.departmentId}
                          label="Department"
                          onChange={handleSelectChange}
                           sx={{color: '#e0e0e0', "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.23)" }, "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.5)" }, "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#fff" }, "& .MuiSvgIcon-root": { color: '#9e9e9e' }}}
                        >
                          <MenuItem value="">All</MenuItem>
                          {departments.map((dept) => (
                            <MenuItem key={dept.id} value={dept.id}>{dept.name}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <FormControl fullWidth variant="outlined">
                        <InputLabel sx={{color: '#b0b0b0'}}>Province</InputLabel>
                        <Select
                          name="provinceId"
                          value={filters.provinceId}
                          label="Province"
                          onChange={handleSelectChange}
                           sx={{color: '#e0e0e0', "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.23)" }, "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.5)" }, "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#fff" }, "& .MuiSvgIcon-root": { color: '#9e9e9e' }}}
                        >
                          <MenuItem value="">All</MenuItem>
                          {provinces.map((prov) => (
                            <MenuItem key={prov.id} value={prov.id}>{prov.name}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <FormControl fullWidth variant="outlined">
                        <InputLabel sx={{color: '#b0b0b0'}}>Deleted By</InputLabel>
                        <Select
                          name="deletedByUserId"
                          value={filters.deletedByUserId}
                          label="Deleted By"
                          onChange={handleSelectChange}
                           sx={{color: '#e0e0e0', "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.23)" }, "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.5)" }, "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#fff" }, "& .MuiSvgIcon-root": { color: '#9e9e9e' }}}
                        >
                          <MenuItem value="">All</MenuItem>
                          {users.map((u) => (
                            <MenuItem key={u.id} value={u.id}>{u.username}</MenuItem>
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
                        InputLabelProps={{ shrink: true, style: { color: '#b0b0b0' } }}
                        InputProps={{ style: { color: '#e0e0e0' } }}
                        sx={{ "& .MuiOutlinedInput-root": { "& fieldset": { borderColor: "rgba(255,255,255,0.23)" }, "&:hover fieldset": { borderColor: "rgba(255,255,255,0.5)" }, "&.Mui-focused fieldset": { borderColor: "#fff" }, "& .MuiSvgIcon-root": { color: '#9e9e9e' } }}}
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
                        InputLabelProps={{ shrink: true, style: { color: '#b0b0b0' } }}
                        InputProps={{ style: { color: '#e0e0e0' } }}
                         sx={{ "& .MuiOutlinedInput-root": { "& fieldset": { borderColor: "rgba(255,255,255,0.23)" }, "&:hover fieldset": { borderColor: "rgba(255,255,255,0.5)" }, "&.Mui-focused fieldset": { borderColor: "#fff" }, "& .MuiSvgIcon-root": { color: '#9e9e9e' } }}}
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
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }}>
                <Typography variant="h6" sx={{color:'#fff'}}>No deleted tasks found</Typography>
                <Typography variant="body2" sx={{color:'rgba(255,255,255,0.7)'}}>
                  When tasks are deleted with a reason, they will appear here.
                </Typography>
              </Paper>
            ) : (
              <>
                <TableContainer component={Paper} sx={{ 
                  borderRadius: '12px', 
                  backgroundColor: 'rgba(255, 255, 255, 0.08)', 
                  backdropFilter: 'blur(10px)', 
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  "&::-webkit-scrollbar": { width: '8px' },
                  "&::-webkit-scrollbar-track": { background: 'rgba(255,255,255,0.05)' },
                  "&::-webkit-scrollbar-thumb": { background: 'rgba(255,255,255,0.2)', borderRadius: '4px' }
                }}>
                  <Table stickyHeader>
                    <TableHead>
                      <TableRow>
                        {['Task Title', 'Created By', 'Deleted By', 'Deleted At', 'Reason', 'Assignees', 'Actions'].map(headCell => (
                            <TableCell key={headCell} sx={{background: 'rgba(0,0,0,0.3)', color: '#fff', fontWeight:'bold'}}>{headCell}</TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {deletedTasks.map((task) => (
                        <TableRow key={task.id} hover sx={{'&:hover': {backgroundColor: 'rgba(255,255,255,0.05) !important'}}}>
                          <TableCell sx={{color:'#e0e0e0'}}>
                            <Tooltip title={task.description || 'No description'} arrow>
                              <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                {task.title}
                              </Typography>
                            </Tooltip>
                          </TableCell>
                          <TableCell sx={{color:'#c0c0c0'}}>{task.createdBy?.username || 'N/A'}</TableCell>
                          <TableCell sx={{color:'#c0c0c0'}}>{task.deletedBy?.username || 'N/A'}</TableCell>
                          <TableCell sx={{color:'#c0c0c0'}}>
                            {formatRelativeTime(task.deletedAt || task.updatedAt)} 
                          </TableCell>
                          <TableCell sx={{color:'#c0c0c0'}}>
                            <Tooltip title={task.deletionReason || 'N/A'} arrow>
                              <Typography 
                                variant="body2" 
                                sx={{ 
                                  maxWidth: '200px', 
                                  overflow: 'hidden', 
                                  textOverflow: 'ellipsis', 
                                  whiteSpace: 'nowrap' 
                                }}
                              >
                                {task.deletionReason || 'N/A'}
                              </Typography>
                            </Tooltip>
                          </TableCell>
                          <TableCell sx={{color:'#c0c0c0'}}>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                              {task.assignedToUsers?.map((u) => (
                                <Chip key={u.id} label={u.username} size="small" sx={{background: 'rgba(255,255,255,0.1)', color:'#fff'}}/>
                              ))}
                              {task.assignedToDepartments?.map((dept) => (
                                <Chip key={dept.id} label={dept.name} size="small" variant="outlined" sx={{borderColor: 'rgba(255,255,255,0.3)', color:'#fff'}} />
                              ))}
                              {task.assignedToProvince && (
                                <Chip label={task.assignedToProvince.name} size="small" variant="outlined" color="secondary" />
                              )}
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Tooltip title="Restore Task">
                              <IconButton onClick={() => handleRestoreClick(task.id)} color="primary" disabled={isSubmitting} sx={{color: '#66bb6a'}}>
                                <RestoreIcon />
                              </IconButton>
                            </Tooltip>
                            {isAdmin && (
                              <Tooltip title="Delete Forever">
                                <IconButton onClick={() => handleDeleteForeverClick(task.id)} color="error" disabled={isSubmitting} sx={{color: '#f44336'}}>
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
                  sx={{ color: 'white', "& .MuiTablePagination-selectIcon": { color: '#fff' }, "& .MuiTablePagination-actions IconButton": { color: '#fff' }, "& .Mui-disabled": { color: 'rgba(255,255,255,0.3)' }}}
                />
              </>
            )}
          </>
        )}
        
        <Dialog open={openRestoreDialog} onClose={() => setOpenRestoreDialog(false)} PaperProps={{sx: {background: 'rgba(50,50,50,0.9)', backdropFilter: 'blur(5px)', color:'#fff'}}}>
          <DialogTitle>Restore Task</DialogTitle>
          <DialogContent>
            <DialogContentText sx={{color:'rgba(255,255,255,0.8)'}}>
              Are you sure you want to restore this task? It will be moved back to pending status.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenRestoreDialog(false)} sx={{color: '#ccc'}}>Cancel</Button>
            <Button onClick={confirmRestore} color="primary" variant="contained" disabled={isSubmitting}>
              {isSubmitting && openRestoreDialog ? <CircularProgress size={20} color="inherit" sx={{mr:1}}/> : 'Restore'}
            </Button>
          </DialogActions>
        </Dialog>
        
        <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)} PaperProps={{sx: {background: 'rgba(50,50,50,0.9)', backdropFilter: 'blur(5px)', color:'#fff'}}}>
          <DialogTitle>Delete Task Permanently</DialogTitle>
          <DialogContent>
            <DialogContentText sx={{color:'rgba(255,255,255,0.8)'}}>
              Warning: This action cannot be undone. The task will be permanently deleted from the system.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDeleteDialog(false)} sx={{color: '#ccc'}}>Cancel</Button>
            <Button onClick={confirmDeleteForever} color="error" variant="contained" disabled={isSubmitting}>
             {isSubmitting && openDeleteDialog ? <CircularProgress size={20} color="inherit" sx={{mr:1}}/> : 'Delete Forever'}
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog open={openConfirmWipeDialog} onClose={() => setOpenConfirmWipeDialog(false)} PaperProps={{sx: {background: 'rgba(50,50,50,0.9)', backdropFilter: 'blur(5px)', color:'#fff'}}}>
            <DialogTitle sx={{color: '#f44336'}}>Confirm Wipe Recycle Bin</DialogTitle>
            <DialogContent>
                <DialogContentText sx={{color:'rgba(255,255,255,0.8)'}}>
                    Are you sure you want to permanently delete ALL tasks from the Recycle Bin?
                    This action CANNOT be undone.
                </DialogContentText>
            </DialogContent>
            <DialogActions>
                <Button onClick={() => setOpenConfirmWipeDialog(false)} sx={{color: '#ccc'}}>Cancel</Button>
                <Button onClick={confirmWipeAllRecycleBin} color="error" variant="contained" disabled={isSubmitting}>
                     {isSubmitting && openConfirmWipeDialog ? <CircularProgress size={20} color="inherit" sx={{mr:1}}/> : 'Confirm Wipe All'}
                </Button>
            </DialogActions>
        </Dialog>

        {snackbar && (
            <Snackbar open autoHideDuration={6000} onClose={handleCloseSnackbar} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
                <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%', background: snackbar.severity === 'error' ? '#d32f2f' : '#43a047', color:'#fff' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        )}
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