import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import {
  Box,
  Typography,
  Paper,
  Alert,
  Skeleton,
  Button,
  Tabs,
  Tab,
  Divider,
  Grid
} from '@mui/material';
import { Add as AddIcon, People as PeopleIcon } from '@mui/icons-material';
import { DepartmentService } from '../../services/department';
import { Department, Task, TaskStatus, TaskType } from '@/types';
import TasksSection from './TasksSection';
import TaskViewDialog from '@/components/tasks/TaskViewDialog';
import EditTaskDialog from '@/components/tasks/EditTaskDialog';
import MemberCard from './MemberCard';
import { RootState } from '@/store';

interface DepartmentDetailProps {
  departmentId: string;
  onAddTaskClick: () => void;
}

const DepartmentDetail: React.FC<DepartmentDetailProps> = ({ departmentId, onAddTaskClick }) => {
  const { user: currentUser } = useSelector((state: RootState) => state.auth);
  const [tabValue, setTabValue] = useState(0);

  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [viewTaskDialogOpen, setViewTaskDialogOpen] = useState(false);
  const [editTaskDialogOpen, setEditTaskDialogOpen] = useState(false);
  const [initialTaskStatus, setInitialTaskStatus] = useState<TaskStatus>(TaskStatus.PENDING);
  const [initialTaskType, setInitialTaskType] = useState<TaskType>(TaskType.USER);

  const { 
    data: department, 
    isLoading: isLoadingDepartment, 
    error: fetchDepartmentError 
  } = useQuery<Department, Error>({
    queryKey: ['departmentDetails', departmentId], 
    queryFn: () => DepartmentService.getDepartment(departmentId),
    enabled: !!departmentId,
  });
  
  const { data: tasks } = useQuery<Task[], Error>({
    queryKey: ['departmentTasks', departmentId], 
    queryFn: () => DepartmentService.getDepartmentTasks(departmentId),
    enabled: !!departmentId,
  });

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setInitialTaskStatus(task.status);
    setInitialTaskType(task.type);
    setViewTaskDialogOpen(true);
  };

  if (isLoadingDepartment) {
    return (
      <Paper elevation={3} sx={{ p: 3, borderRadius: 2, background: 'rgba(255, 255, 255, 0.08)' }}>
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
          <Typography variant="h5" gutterBottom sx={{ color: '#fff' }}>{department?.name}</Typography>
          <Typography variant="body2" color="rgba(255, 255, 255, 0.7)" sx={{ mb: 2 }}>
            {department?.description || 'No description provided.'}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />} 
            onClick={onAddTaskClick} 
            size="small"
            sx={{ 
              mr: 1,
              background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
              boxShadow: '0 4px 10px rgba(33, 150, 243, 0.3)',
            }}
          >
            New Task
          </Button>
        </Box>
      </Box>
      
      <Divider sx={{ my: 2, borderColor: 'rgba(255, 255, 255, 0.1)' }} />

      <Box sx={{ borderBottom: 1, borderColor: 'rgba(255, 255, 255, 0.1)', mb: 3 }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange} 
          aria-label="department details tabs"
          textColor="inherit"
          sx={{ 
            '& .MuiTab-root': { 
              color: 'rgba(255, 255, 255, 0.7)',
              '&.Mui-selected': { color: '#fff' }
            },
            '& .MuiTabs-indicator': { backgroundColor: '#2196F3' }
          }}
        >
          <Tab label="Members" />
          <Tab label="Tasks" />
        </Tabs>
      </Box>
      
      {tabValue === 0 && (
        <Box sx={{ minHeight: '300px' }}>
          <Typography variant="h6" sx={{ mb: 3, color: '#fff', display: 'flex', alignItems: 'center', gap: 1 }}>
            <PeopleIcon />
            Department Members ({department?.members?.length || 0})
          </Typography>
          
          {department?.members && department.members.length > 0 ? (
            <Grid container spacing={3}>
              {department.members.map(member => {
                // Prepare member data for MemberCard
                const memberData = {
                  id: member.id,
                  username: member.username,
                  first_name: member.first_name,
                  last_name: member.last_name,
                  avatar: member.avatar,
                  position: member.position,
                  role: member.role,
                };

                return (
                  <Grid item xs={12} sm={6} md={4} key={member.id}>
                    <MemberCard
                      member={memberData}
                      canRemove={false} // Don't show remove button in this context
                    />
                  </Grid>
                );
              })}
            </Grid>
          ) : (
            <Box sx={{ 
              textAlign: 'center', 
              py: 6,
              background: 'rgba(255, 255, 255, 0.03)',
              borderRadius: 2,
              border: '1px dashed rgba(255, 255, 255, 0.1)'
            }}>
              <PeopleIcon sx={{ fontSize: 64, color: 'rgba(255, 255, 255, 0.3)', mb: 2 }} />
              <Typography variant="h6" color="rgba(255, 255, 255, 0.7)" sx={{ mb: 1 }}>
                No members assigned
              </Typography>
              <Typography variant="body2" color="rgba(255, 255, 255, 0.5)">
                This department doesn't have any members yet.
              </Typography>
            </Box>
          )}
        </Box>
      )}
      
      {tabValue === 1 && (
        <TasksSection 
          tasks={tasks}
          currentUserId={String(currentUser?.id || '0')}
          currentDepartmentId={departmentId}
          viewMode="department"
          onTaskClick={handleTaskClick}
        />
      )}

      {selectedTask && viewTaskDialogOpen && (
        <TaskViewDialog
          taskId={selectedTask.id}
          open={viewTaskDialogOpen}
          onClose={() => {
            setViewTaskDialogOpen(false);
            setSelectedTask(null);
          }}
          onEdit={() => {
            setViewTaskDialogOpen(false);
            setEditTaskDialogOpen(true);
          }}
        />
      )}

      {selectedTask && editTaskDialogOpen && (
        <EditTaskDialog
          taskId={selectedTask.id}
          open={editTaskDialogOpen}
          onClose={() => {
            setEditTaskDialogOpen(false);
            setSelectedTask(null);
          }}
          onTaskUpdated={() => {
            setEditTaskDialogOpen(false);
            setSelectedTask(null);
          }}
        />
      )}
    </Paper>
  );
};

export default DepartmentDetail; 