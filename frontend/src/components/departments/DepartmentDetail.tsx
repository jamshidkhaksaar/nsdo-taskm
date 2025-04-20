import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useSelector } from 'react-redux';
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
  Tabs,
  Tab,
  Skeleton,
  useTheme,
} from '@mui/material';
import WorkIcon from '@mui/icons-material/Work';
import PeopleIcon from '@mui/icons-material/People';
import AssignmentIcon from '@mui/icons-material/Assignment';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import PeopleAddIcon from '@mui/icons-material/GroupAdd';
import AddMemberDialog from './AddMemberDialog';
import { DepartmentService } from '../../services/department';
import { TaskService } from '../../services/task';
import { Department, User, Task } from '@/types/index';
import TasksSection from './TasksSection';
import DepartmentStatusStats from './DepartmentStatusStats';
import { RootState } from '@/store';

interface DepartmentDetailProps {
  departmentId: string;
  onAddTaskClick: () => void;
}

const DepartmentDetail: React.FC<DepartmentDetailProps> = ({ departmentId, onAddTaskClick }) => {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const { user: currentUser } = useSelector((state: RootState) => state.auth);
  const [tabValue, setTabValue] = useState(0);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);

  const { 
    data: department, 
    isLoading: isLoadingDepartment, 
    error: fetchDepartmentError 
  } = useQuery<Department, Error>(
    ['departmentDetails', departmentId], 
    () => DepartmentService.getDepartment(departmentId),
    {
      enabled: !!departmentId,
    }
  );
  
  const { 
    data: tasks = [], 
    isLoading: isLoadingTasks, 
    error: fetchTasksError 
  } = useQuery<Task[], Error>(
    ['departmentTasks', departmentId], 
    () => TaskService.getTasksByDepartment(departmentId),
    {
      enabled: !!departmentId && tabValue === 1,
    }
  );

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleMemberAdded = () => {
    queryClient.invalidateQueries(['departmentDetails', departmentId]);
  };

  if (isLoadingDepartment) {
    return (
      <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
        <Skeleton variant="text" width="60%" height={40} />
        <Skeleton variant="text" width="80%" height={20} sx={{ mt: 1 }} />
        <Skeleton variant="rectangular" height={50} sx={{ mt: 2 }} />
        <Skeleton variant="rectangular" height={200} sx={{ mt: 2 }} />
      </Paper>
    );
  }

  if (fetchDepartmentError || !department) {
    return <Alert severity="error">Failed to load department details.</Alert>;
  }

  return (
    <Paper elevation={3} sx={{ p: 3, borderRadius: 2, background: 'rgba(255, 255, 255, 0.08)' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
        <Box>
          <Typography variant="h5" gutterBottom>{department.name}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {department.description || 'No description provided.'}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
            <Button 
              variant="contained" 
              startIcon={<AddIcon />} 
              onClick={onAddTaskClick} 
              size="small"
              sx={{ mr: 1 }}
            >
              New Task
            </Button>
            <Button 
              variant="outlined" 
              startIcon={<PeopleAddIcon />} 
              onClick={() => setIsAddMemberOpen(true)} 
              size="small"
            >
              Add Member
            </Button>
        </Box>
      </Box>
      
      <DepartmentStatusStats departmentId={departmentId} />

      <Divider sx={{ my: 2 }} />

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="department details tabs">
          <Tab label="Members" />
          <Tab label="Tasks" />
        </Tabs>
      </Box>
      
      {tabValue === 0 && (
          <Box>
            <Typography variant="h6" sx={{ mb: 1 }}>Members</Typography>
            {department.members && department.members.length > 0 ? (
                 <ul>
                   {department.members.map(member => (
                     <li key={member.id}>{member.username} ({member.email})</li>
                   ))}
                 </ul>
            ) : (
              <Typography variant="body2" color="text.secondary">No members assigned.</Typography>
            )}
           </Box>
      )}
      {tabValue === 1 && (
          <TasksSection 
            tasks={tasks} 
            currentUserId={parseInt(String(currentUser?.id || '0'), 10)}
            currentDepartmentId={parseInt(departmentId, 10)}
            viewMode="department"
          />
      )}
      
      <AddMemberDialog 
        open={isAddMemberOpen} 
        onClose={() => setIsAddMemberOpen(false)} 
        departmentId={departmentId}
        currentMembers={department.members || []}
        onMemberAdded={handleMemberAdded}
      />
    </Paper>
  );
};

export default DepartmentDetail; 