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
  Divider
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { DepartmentService } from '../../services/department';
import { TaskService } from '../../services/task';
import { Department, Task, TaskStatus, TaskType } from '@/types';
import TasksSection from './TasksSection';
import TaskViewDialog from '@/components/tasks/TaskViewDialog';
import EditTaskDialog from '@/components/tasks/EditTaskDialog';
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
    queryFn: () => TaskService.getTasksByDepartment(departmentId),
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
          <Typography variant="h5" gutterBottom>{department?.name}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {department?.description || 'No description provided.'}
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
        </Box>
      </Box>
      
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
            {department?.members && department.members.length > 0 ? (
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
            onTaskClick={handleTaskClick}
          />
      )}

      {selectedTask && viewTaskDialogOpen && (
        <TaskViewDialog
          task={selectedTask}
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
          task={selectedTask}
          open={editTaskDialogOpen}
          onClose={() => {
            setEditTaskDialogOpen(false);
            setSelectedTask(null);
          }}
          onSuccess={() => {
            setEditTaskDialogOpen(false);
            setSelectedTask(null);
          }}
        />
      )}
    </Paper>
  );
};

export default DepartmentDetail; 