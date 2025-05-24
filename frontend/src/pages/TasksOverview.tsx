import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Tabs,
  Tab,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Grid,
  Card,
  CardContent,
  CardHeader,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  IconButton,
  Divider,
  LinearProgress,
  useTheme,
  Skeleton,
  Alert,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  SelectChangeEvent,
} from '@mui/material';
import {
  Assignment as TaskIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  LocationOn as ProvinceIcon,
  Delete as DeleteIcon,
  Restore as RestoreIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  FilterList as FilterIcon,
  Visibility as ViewIcon,
  Assessment as ChartIcon,
  Schedule as PendingIcon,
  PlayArrow as InProgressIcon,
  CheckCircle as CompletedIcon,
  Forward as DelegatedIcon,
} from '@mui/icons-material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Task, TaskStatus, TaskType, User, Department, Province } from '../types';
import { TaskService } from '../services/task';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { format } from 'date-fns';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel({ children, value, index, ...other }: TabPanelProps) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`overview-tabpanel-${index}`}
      aria-labelledby={`overview-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

interface TaskStats {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  completionRate: number;
}

interface RecycleBinTask extends Task {
  deletedAt: Date;
  deletedBy: User;
  deletionReason: string;
}

interface DelegationInfo {
  task: Task;
  delegatedBy: User;
  delegatedTo: User;
  delegationReason: string;
  delegatedAt: Date;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const TasksOverview: React.FC = () => {
  const theme = useTheme();
  const { user: currentUser } = useSelector((state: RootState) => state.auth);
  
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [recycleBinTasks, setRecycleBinTasks] = useState<RecycleBinTask[]>([]);
  const [delegations, setDelegations] = useState<DelegationInfo[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [provinces, setProvinces] = useState<Province[]>([]);
  
  // Filters
  const [userFilter, setUserFilter] = useState<string>('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('');
  const [provinceFilter, setProvinceFilter] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<string>('all');
  
  // Dialogs
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [selectedTaskToRestore, setSelectedTaskToRestore] = useState<RecycleBinTask | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [tasksData, usersData, deptsData, provData] = await Promise.all([
          TaskService.getAllTasks(),
          TaskService.getUsers(),
          TaskService.getDepartments(),
          TaskService.getProvinces(),
        ]);
        
        setTasks(tasksData.filter(task => !task.isDeleted));
        setUsers(usersData);
        setDepartments(deptsData);
        setProvinces(provData);
        
        // Simulate loading recycle bin data and delegations
        // In real implementation, these would be separate API calls
        const deletedTasks = tasksData.filter(task => task.isDeleted);
        setRecycleBinTasks(deletedTasks as RecycleBinTask[]);
        
        const delegatedTasks = tasksData.filter(task => task.isDelegated);
        setDelegations(delegatedTasks.map(task => ({
          task,
          delegatedBy: task.delegatedBy || {} as User,
          delegatedTo: task.assignedToUsers?.[0] || {} as User,
          delegationReason: task.delegationReason || '',
          delegatedAt: new Date(task.createdAt),
        })));
        
      } catch (error) {
        console.error('Error loading tasks overview data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      if (userFilter && !task.assignedToUsers?.some(user => user.id === userFilter)) {
        return false;
      }
      if (departmentFilter && !task.assignedToDepartments?.some(dept => dept.id === departmentFilter)) {
        return false;
      }
      if (provinceFilter && task.assignedToProvince?.id !== provinceFilter) {
        return false;
      }
      if (dateFilter !== 'all') {
        const taskDate = new Date(task.createdAt);
        const now = new Date();
        const daysDiff = Math.floor((now.getTime() - taskDate.getTime()) / (1000 * 60 * 60 * 24));
        
        switch (dateFilter) {
          case 'week':
            return daysDiff <= 7;
          case 'month':
            return daysDiff <= 30;
          case 'quarter':
            return daysDiff <= 90;
          default:
            return true;
        }
      }
      return true;
    });
  }, [tasks, userFilter, departmentFilter, provinceFilter, dateFilter]);

  const taskStats: TaskStats = useMemo(() => {
    const total = filteredTasks.length;
    const pending = filteredTasks.filter(task => task.status === TaskStatus.PENDING).length;
    const inProgress = filteredTasks.filter(task => task.status === TaskStatus.IN_PROGRESS).length;
    const completed = filteredTasks.filter(task => task.status === TaskStatus.COMPLETED).length;
    const completionRate = total > 0 ? (completed / total) * 100 : 0;

    return { total, pending, inProgress, completed, completionRate };
  }, [filteredTasks]);

  const chartData = useMemo(() => {
    const statusData = [
      { name: 'Pending', value: taskStats.pending, color: '#FFA726' },
      { name: 'In Progress', value: taskStats.inProgress, color: '#42A5F5' },
      { name: 'Completed', value: taskStats.completed, color: '#66BB6A' },
    ];

    const typeData = [
      { name: 'Personal', value: filteredTasks.filter(task => task.type === TaskType.PERSONAL).length },
      { name: 'Department', value: filteredTasks.filter(task => task.type === TaskType.DEPARTMENT).length },
      { name: 'User', value: filteredTasks.filter(task => task.type === TaskType.USER).length },
      { name: 'Province', value: filteredTasks.filter(task => task.type === TaskType.PROVINCE_DEPARTMENT).length },
    ];

    return { statusData, typeData };
  }, [filteredTasks, taskStats]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleRestoreTask = async (task: RecycleBinTask) => {
    try {
      await TaskService.restoreTask(task.id);
      setRecycleBinTasks(prev => prev.filter(t => t.id !== task.id));
      setRestoreDialogOpen(false);
      setSelectedTaskToRestore(null);
    } catch (error) {
      console.error('Error restoring task:', error);
    }
  };

  const getStatusIcon = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.PENDING:
        return <PendingIcon sx={{ color: '#FFA726' }} />;
      case TaskStatus.IN_PROGRESS:
        return <InProgressIcon sx={{ color: '#42A5F5' }} />;
      case TaskStatus.COMPLETED:
        return <CompletedIcon sx={{ color: '#66BB6A' }} />;
      default:
        return <TaskIcon />;
    }
  };

  const getTypeIcon = (type: TaskType) => {
    switch (type) {
      case TaskType.PERSONAL:
        return <PersonIcon />;
      case TaskType.DEPARTMENT:
        return <BusinessIcon />;
      case TaskType.USER:
        return <PersonIcon />;
      case TaskType.PROVINCE_DEPARTMENT:
        return <ProvinceIcon />;
      default:
        return <TaskIcon />;
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Skeleton variant="text" width="30%" height={40} />
        <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} variant="rectangular" width="25%" height={120} />
          ))}
        </Box>
        <Skeleton variant="rectangular" width="100%" height={400} sx={{ mt: 2 }} />
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', minHeight: '100vh', bgcolor: 'background.default' }}>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom fontWeight="600">
          Tasks Overview
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Monitor task performance across users, departments, and provinces
        </Typography>

        {/* Statistics Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="text.secondary" gutterBottom>
                      Total Tasks
                    </Typography>
                    <Typography variant="h4" fontWeight="600">
                      {taskStats.total}
                    </Typography>
                  </Box>
                  <TaskIcon sx={{ fontSize: 40, color: 'primary.main' }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="text.secondary" gutterBottom>
                      Completion Rate
                    </Typography>
                    <Typography variant="h4" fontWeight="600">
                      {taskStats.completionRate.toFixed(1)}%
                    </Typography>
                  </Box>
                  <TrendingUpIcon sx={{ fontSize: 40, color: 'success.main' }} />
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={taskStats.completionRate}
                  sx={{ mt: 1, height: 6, borderRadius: 3 }}
                />
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="text.secondary" gutterBottom>
                      In Progress
                    </Typography>
                    <Typography variant="h4" fontWeight="600">
                      {taskStats.inProgress}
                    </Typography>
                  </Box>
                  <InProgressIcon sx={{ fontSize: 40, color: 'info.main' }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="text.secondary" gutterBottom>
                      Pending
                    </Typography>
                    <Typography variant="h4" fontWeight="600">
                      {taskStats.pending}
                    </Typography>
                  </Box>
                  <PendingIcon sx={{ fontSize: 40, color: 'warning.main' }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Filters */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <FilterIcon />
            <Typography variant="h6">Filters</Typography>
            
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>User</InputLabel>
              <Select
                value={userFilter}
                label="User"
                onChange={(e: SelectChangeEvent) => setUserFilter(e.target.value)}
              >
                <MenuItem value="">All Users</MenuItem>
                {users.map((user) => (
                  <MenuItem key={user.id} value={user.id}>
                    {user.firstName} {user.lastName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Department</InputLabel>
              <Select
                value={departmentFilter}
                label="Department"
                onChange={(e: SelectChangeEvent) => setDepartmentFilter(e.target.value)}
              >
                <MenuItem value="">All Departments</MenuItem>
                {departments.map((dept) => (
                  <MenuItem key={dept.id} value={dept.id}>
                    {dept.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Province</InputLabel>
              <Select
                value={provinceFilter}
                label="Province"
                onChange={(e: SelectChangeEvent) => setProvinceFilter(e.target.value)}
              >
                <MenuItem value="">All Provinces</MenuItem>
                {provinces.map((province) => (
                  <MenuItem key={province.id} value={province.id}>
                    {province.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Date Range</InputLabel>
              <Select
                value={dateFilter}
                label="Date Range"
                onChange={(e: SelectChangeEvent) => setDateFilter(e.target.value)}
              >
                <MenuItem value="all">All Time</MenuItem>
                <MenuItem value="week">Last Week</MenuItem>
                <MenuItem value="month">Last Month</MenuItem>
                <MenuItem value="quarter">Last Quarter</MenuItem>
              </Select>
            </FormControl>

            <Button
              variant="outlined"
              size="small"
              onClick={() => {
                setUserFilter('');
                setDepartmentFilter('');
                setProvinceFilter('');
                setDateFilter('all');
              }}
            >
              Clear Filters
            </Button>
          </Box>
        </Paper>

        {/* Charts */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardHeader title="Task Status Distribution" />
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={chartData.statusData}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {chartData.statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card>
              <CardHeader title="Task Types" />
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData.typeData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <RechartsTooltip />
                    <Bar dataKey="value" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Tabs */}
        <Paper sx={{ width: '100%' }}>
          <Tabs value={activeTab} onChange={handleTabChange} variant="fullWidth">
            <Tab label="Pending Tasks" />
            <Tab label="In Progress Tasks" />
            <Tab label="Completed Tasks" />
            <Tab label="Deleted Tasks" />
            <Tab label="Delegated Tasks" />
          </Tabs>

          {/* Pending Tasks */}
          <TabPanel value={activeTab} index={0}>
            <TasksTable 
              tasks={filteredTasks.filter(task => task.status === TaskStatus.PENDING)}
              users={users}
              departments={departments}
              provinces={provinces}
            />
          </TabPanel>

          {/* In Progress Tasks */}
          <TabPanel value={activeTab} index={1}>
            <TasksTable 
              tasks={filteredTasks.filter(task => task.status === TaskStatus.IN_PROGRESS)}
              users={users}
              departments={departments}
              provinces={provinces}
            />
          </TabPanel>

          {/* Completed Tasks */}
          <TabPanel value={activeTab} index={2}>
            <TasksTable 
              tasks={filteredTasks.filter(task => task.status === TaskStatus.COMPLETED)}
              users={users}
              departments={departments}
              provinces={provinces}
            />
          </TabPanel>

          {/* Deleted Tasks (Recycle Bin) */}
          <TabPanel value={activeTab} index={3}>
            <RecycleBinTable 
              tasks={recycleBinTasks}
              onRestore={(task) => {
                setSelectedTaskToRestore(task);
                setRestoreDialogOpen(true);
              }}
            />
          </TabPanel>

          {/* Delegated Tasks */}
          <TabPanel value={activeTab} index={4}>
            <DelegatedTasksTable delegations={delegations} />
          </TabPanel>
        </Paper>
      </Box>

      {/* Restore Dialog */}
      <Dialog open={restoreDialogOpen} onClose={() => setRestoreDialogOpen(false)}>
        <DialogTitle>Restore Task</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to restore "{selectedTaskToRestore?.title}"?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRestoreDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={() => selectedTaskToRestore && handleRestoreTask(selectedTaskToRestore)}
            variant="contained"
          >
            Restore
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

// Helper Components
const TasksTable: React.FC<{
  tasks: Task[];
  users: User[];
  departments: Department[];
  provinces: Province[];
}> = ({ tasks, users, departments, provinces }) => {
  if (tasks.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="h6" color="text.secondary">
          No tasks found
        </Typography>
      </Box>
    );
  }

  return (
    <List>
      {tasks.map((task, index) => (
        <React.Fragment key={task.id}>
          <ListItem alignItems="flex-start">
            <ListItemAvatar>
              <Avatar sx={{ bgcolor: 'primary.main' }}>
                <TaskIcon />
              </Avatar>
            </ListItemAvatar>
            <ListItemText
              primary={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="subtitle1" fontWeight="600">
                    {task.title}
                  </Typography>
                  <Chip 
                    label={task.status.replace('_', ' ').toUpperCase()} 
                    size="small"
                    color={
                      task.status === TaskStatus.COMPLETED ? 'success' :
                      task.status === TaskStatus.IN_PROGRESS ? 'info' : 'warning'
                    }
                  />
                  <Chip 
                    label={task.priority.toUpperCase()} 
                    size="small" 
                    variant="outlined"
                    color={
                      task.priority === 'high' ? 'error' :
                      task.priority === 'medium' ? 'warning' : 'success'
                    }
                  />
                </Box>
              }
              secondary={
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {task.description}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Created: {format(new Date(task.createdAt), 'MMM dd, yyyy')}
                    {task.dueDate && ` • Due: ${format(new Date(task.dueDate), 'MMM dd, yyyy')}`}
                  </Typography>
                </Box>
              }
            />
          </ListItem>
          {index < tasks.length - 1 && <Divider variant="inset" component="li" />}
        </React.Fragment>
      ))}
    </List>
  );
};

const RecycleBinTable: React.FC<{
  tasks: RecycleBinTask[];
  onRestore: (task: RecycleBinTask) => void;
}> = ({ tasks, onRestore }) => {
  if (tasks.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="h6" color="text.secondary">
          No deleted tasks found
        </Typography>
      </Box>
    );
  }

  return (
    <List>
      {tasks.map((task, index) => (
        <React.Fragment key={task.id}>
          <ListItem
            alignItems="flex-start"
            secondaryAction={
              <Tooltip title="Restore Task">
                <IconButton edge="end" onClick={() => onRestore(task)}>
                  <RestoreIcon />
                </IconButton>
              </Tooltip>
            }
          >
            <ListItemAvatar>
              <Avatar sx={{ bgcolor: 'error.main' }}>
                <DeleteIcon />
              </Avatar>
            </ListItemAvatar>
            <ListItemText
              primary={
                <Typography variant="subtitle1" fontWeight="600">
                  {task.title}
                </Typography>
              }
              secondary={
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Reason: {task.deletionReason}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Deleted: {format(new Date(task.deletedAt), 'MMM dd, yyyy')} by {task.deletedBy?.firstName} {task.deletedBy?.lastName}
                  </Typography>
                </Box>
              }
            />
          </ListItem>
          {index < tasks.length - 1 && <Divider variant="inset" component="li" />}
        </React.Fragment>
      ))}
    </List>
  );
};

const DelegatedTasksTable: React.FC<{
  delegations: DelegationInfo[];
}> = ({ delegations }) => {
  if (delegations.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="h6" color="text.secondary">
          No delegated tasks found
        </Typography>
      </Box>
    );
  }

  return (
    <List>
      {delegations.map((delegation, index) => (
        <React.Fragment key={delegation.task.id}>
          <ListItem alignItems="flex-start">
            <ListItemAvatar>
              <Avatar sx={{ bgcolor: 'secondary.main' }}>
                <DelegatedIcon />
              </Avatar>
            </ListItemAvatar>
            <ListItemText
              primary={
                <Typography variant="subtitle1" fontWeight="600">
                  {delegation.task.title}
                </Typography>
              }
              secondary={
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Delegated by: {delegation.delegatedBy?.firstName} {delegation.delegatedBy?.lastName} 
                    → {delegation.delegatedTo?.firstName} {delegation.delegatedTo?.lastName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Reason: {delegation.delegationReason}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Delegated: {format(new Date(delegation.delegatedAt), 'MMM dd, yyyy')}
                  </Typography>
                </Box>
              }
            />
          </ListItem>
          {index < delegations.length - 1 && <Divider variant="inset" component="li" />}
        </React.Fragment>
      ))}
    </List>
  );
};

export default TasksOverview; 