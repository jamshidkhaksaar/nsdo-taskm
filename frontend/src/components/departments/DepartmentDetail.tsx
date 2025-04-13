import React, { useState } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  Grid,
  Card,
  CardContent,
  AvatarGroup,
  Avatar,
  Tooltip,
  Divider,
  Button,
} from '@mui/material';
import WorkIcon from '@mui/icons-material/Work';
import PeopleIcon from '@mui/icons-material/People';
import AssignmentIcon from '@mui/icons-material/Assignment';
import AddIcon from '@mui/icons-material/Add';
import PeopleAddIcon from '@mui/icons-material/GroupAdd';
import AddMemberDialog from './AddMemberDialog';
import { DepartmentService } from '../../services/department';
import { TaskService } from '../../services/task';
import { Department } from '../../types/department';
import { Task } from '../../types/task';
import { User } from '../../types/user'; // Use this consistent import
import TasksSection from './TasksSection'; // Reusing TasksSection

interface DepartmentDetailProps {
  departmentId: string;
  onAddTaskClick: () => void;
}

const DepartmentDetail: React.FC<DepartmentDetailProps> = ({ departmentId, onAddTaskClick }) => {
  const queryClient = useQueryClient();
  const [isAddMemberDialogOpen, setIsAddMemberDialogOpen] = useState(false);

  // Fetch specific department details
  const { 
    data: department, 
    isLoading: isLoadingDepartment, 
    error: fetchDepartmentError 
  } = useQuery<Department, Error>(
    ['department', departmentId],
    () => DepartmentService.getDepartment(departmentId),
    {
      enabled: !!departmentId,
      staleTime: 5 * 60 * 1000,
    }
  );

  // Fetch tasks for this specific department
  const { 
    data: tasks = [], 
    isLoading: isLoadingTasks, 
    error: fetchTasksError 
  } = useQuery<Task[], Error>(
    ['departmentTasks', departmentId], 
    () => TaskService.getTasks({ department_id: departmentId }), // Assuming getTasks can filter by department_id
    {
      enabled: !!departmentId,
      staleTime: 2 * 60 * 1000,
    }
  );
  
  // Fetch members for this specific department
  const { 
      data: members = [], 
      isLoading: isLoadingMembers, 
      error: fetchMembersError 
  } = useQuery<User[], Error>(
      ['departmentMembers', departmentId],
      async () => {
          const fetchedMembers = await DepartmentService.getDepartmentMembers(departmentId);
          return fetchedMembers as User[]; 
      },
      {
          enabled: !!departmentId,
          staleTime: 5 * 60 * 1000,
      }
  );

  const isLoading = isLoadingDepartment || isLoadingTasks || isLoadingMembers;
  const combinedError = fetchDepartmentError || fetchTasksError || fetchMembersError;

  const handleMemberAdded = () => {
    setIsAddMemberDialogOpen(false);
    queryClient.invalidateQueries(['departmentMembers', departmentId]);
    queryClient.invalidateQueries(['department', departmentId]); 
  };
  
  const handleMemberRemoved = (userId: string) => {
      console.log("Remove member clicked:", userId);
  };

  if (!departmentId) {
    return (
      <Paper elevation={0} sx={styles.placeholderPaper}>
        <PeopleIcon sx={{ fontSize: 80, color: 'rgba(255, 255, 255, 0.2)' }} />
        <Typography variant="h6" color="rgba(255, 255, 255, 0.7)" mt={2}>
          Select a department
        </Typography>
        <Typography variant="body2" color="rgba(255, 255, 255, 0.5)" textAlign="center">
          Choose a department from the list to view details, tasks, and members.
        </Typography>
      </Paper>
    );
  }

  if (isLoading) {
    return (
      <Paper elevation={0} sx={styles.placeholderPaper}>
        <CircularProgress sx={{ color: '#fff' }} />
        <Typography color="rgba(255, 255, 255, 0.7)" mt={2}>Loading department details...</Typography>
      </Paper>
    );
  }

  if (combinedError) {
    return (
      <Paper elevation={0} sx={styles.containerPaper}>
        <Alert severity="error">
          Failed to load department details: {combinedError.message}
        </Alert>
      </Paper>
    );
  }

  if (!department) {
    return (
      <Paper elevation={0} sx={styles.containerPaper}>
        <Alert severity="warning">
          Department details not found.
        </Alert>
      </Paper>
    );
  }

  // Task filtering within the component based on fetched tasks
  const upcomingTasks = tasks.filter(task => task.status === 'pending' && task.dueDate && new Date(task.dueDate) > new Date());
  const ongoingTasks = tasks.filter(task => task.status === 'in_progress' || (task.status === 'pending' && task.dueDate && new Date(task.dueDate) <= new Date()));
  const completedTasks = tasks.filter(task => task.status === 'completed');

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Department Overview Card */}
      <Paper elevation={0} sx={styles.containerPaper}>
        <Box p={3}>
          <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
            <Box>
              <Typography variant="h5" fontWeight="bold" color="#fff">
                {department.name}
              </Typography>
              <Typography variant="body2" color="rgba(255, 255, 255, 0.7)" mt={0.5}>
                {department.description || 'No description available'}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                size="small"
                startIcon={<PeopleAddIcon />}
                onClick={() => setIsAddMemberDialogOpen(true)}
                sx={{ color: '#fff', borderColor: 'rgba(255, 255, 255, 0.5)' }}
              >
                Add Member
              </Button>
              <Button
                variant="contained"
                size="small"
                startIcon={<AddIcon />}
                onClick={onAddTaskClick}
              >
                Add Task
              </Button>
            </Box>
          </Box>

          <Grid container spacing={2} mt={1}>
            {/* Total Tasks Card */}
            <Grid item xs={12} sm={4}>
              <Card sx={styles.metricCard('blue')}>
                <CardContent>
                  <Typography variant="overline" sx={styles.metricLabel}>Tasks</Typography>
                  <Box sx={styles.metricValueBox}>
                    <AssignmentIcon sx={{ ...styles.metricIcon, color: '#90caf9' }} />
                    <Typography variant="h4" sx={styles.metricValue}>{tasks.length}</Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            {/* Completed Tasks Card */}
            <Grid item xs={12} sm={4}>
              <Card sx={styles.metricCard('green')}>
                <CardContent>
                  <Typography variant="overline" sx={styles.metricLabel}>Completed</Typography>
                  <Box sx={styles.metricValueBox}>
                    <WorkIcon sx={{ ...styles.metricIcon, color: '#a5d6a7' }} />
                    <Typography variant="h4" sx={styles.metricValue}>{completedTasks.length}</Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            {/* Members Card */}
            <Grid item xs={12} sm={4}>
              <Card sx={styles.metricCard('orange')}>
                <CardContent>
                  <Typography variant="overline" sx={styles.metricLabel}>Members</Typography>
                  <Box sx={styles.metricValueBox}>
                    <PeopleIcon sx={{ ...styles.metricIcon, color: '#ffcc80' }} />
                    <Typography variant="h4" sx={styles.metricValue}>{members?.length ?? 0}</Typography> 
                  </Box>
                   {/* Member Avatars */}
                   <Box mt={1.5} display="flex" justifyContent="flex-end">
                        <AvatarGroup max={5} sx={{ '& .MuiAvatar-root': { width: 24, height: 24, fontSize: '0.7rem' } }}>
                            {members?.map((member) => (
                                <Tooltip title={`${member.first_name} ${member.last_name}`} key={member.id}>
                                    <Box sx={{ position: 'relative', display: 'inline-block' }}>
                                        <Avatar alt={`${member.first_name} ${member.last_name}`} src={member.avatar}>
                                            {member.first_name?.charAt(0)}
                                        </Avatar>
                                    </Box>
                                </Tooltip>
                            ))}
                        </AvatarGroup>
                    </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      </Paper>

      {/* Tasks Section */}
      <Paper elevation={0} sx={{ ...styles.containerPaper, overflow: 'auto' }}>
        <Box p={3}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6" fontWeight="bold" color="#fff">
              Tasks Overview
            </Typography>
          </Box>
          <TasksSection
            currentUserId={0}
            currentDepartmentId={parseInt(departmentId)}
            viewMode="department"
            upcomingTasks={upcomingTasks}
            ongoingTasks={ongoingTasks}
            completedTasks={completedTasks}
            onAddTask={onAddTaskClick}
            showAddButton={true}
          />
        </Box>
      </Paper>

      {/* Add Member Dialog */}
      <AddMemberDialog
        open={isAddMemberDialogOpen}
        onClose={() => setIsAddMemberDialogOpen(false)}
        departmentId={departmentId}
        currentMembers={members || []} // Pass current members (handle potential undefined)
        onMemberAdded={handleMemberAdded}
      />
    </Box>
  );
};

// Basic styles (consider moving to a separate file or theme)
const styles = {
  placeholderPaper: {
    borderRadius: 2,
    overflow: 'hidden',
    background: 'rgba(255, 255, 255, 0.08)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    height: 'calc(100vh - 200px)', 
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
    p: 3,
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
  },
  containerPaper: {
    borderRadius: 2,
    overflow: 'hidden',
    background: 'rgba(255, 255, 255, 0.08)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
  },
  metricCard: (color: 'blue' | 'green' | 'orange') => ({
    background: 
      color === 'blue' ? 'linear-gradient(to right, rgba(25, 118, 210, 0.2), rgba(25, 118, 210, 0.4))' :
      color === 'green' ? 'linear-gradient(to right, rgba(76, 175, 80, 0.2), rgba(76, 175, 80, 0.4))' :
      'linear-gradient(to right, rgba(245, 124, 0, 0.2), rgba(245, 124, 0, 0.4))',
    border: 
      color === 'blue' ? '1px solid rgba(25, 118, 210, 0.3)' :
      color === 'green' ? '1px solid rgba(76, 175, 80, 0.3)' :
      '1px solid rgba(245, 124, 0, 0.3)',
    borderRadius: 2,
    height: '100%'
  }),
  metricLabel: {
    color: 'rgba(255, 255, 255, 0.7)'
  },
  metricValueBox: {
    display: 'flex',
    alignItems: 'center',
    gap: 1,
    mt: 1
  },
  metricIcon: {
    fontSize: 36
  },
  metricValue: {
    color: '#fff',
    fontWeight: 'bold'
  }
};

export default DepartmentDetail; 