import React from 'react';
import { Box, Typography, Grid, Card, CardContent, Button } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import AssignmentIcon from '@mui/icons-material/Assignment';
import { Task } from '../../types/task';
import { Department } from '../../services/department';
import TaskTabs from '../tasks/TaskTabs';
import AssignedTasks from '../tasks/AssignedTasks';

interface TaskManagementSectionProps {
  tasks: Task[];
  assignedToMeTasks: Task[];
  assignedByMeTasks: Task[];
  departments: Department[];
  onCreateTask: () => void;
  onAssignTask: () => void;
  onEditTask: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
  onTaskUpdated: () => void;
}

const TaskManagementSection: React.FC<TaskManagementSectionProps> = ({
  tasks,
  assignedToMeTasks,
  assignedByMeTasks,
  departments,
  onCreateTask,
  onAssignTask,
  onEditTask,
  onDeleteTask,
  onTaskUpdated
}) => {
  return (
    <Box sx={{ mt: 4 }}>
      <Typography
        variant="h5"
        sx={{
          color: '#fff',
          mb: 3,
          fontWeight: 500,
        }}
      >
        Task Management
      </Typography>
      
      <Grid container spacing={{ xs: 2, sm: 3 }}>
        <Grid item xs={12}>
          <Card
            sx={{
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(8px)',
              boxShadow: '0 4px 16px 0 rgba(31, 38, 135, 0.37)',
              border: '1px solid rgba(255, 255, 255, 0.18)',
              mb: 3,
              borderRadius: '8px',
              color: '#fff',
            }}
          >
            <CardContent>
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                mb: 2
              }}>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    color: '#fff',
                    fontWeight: 500,
                  }}
                >
                  My Tasks
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={onCreateTask}
                  sx={{
                    backgroundColor: 'rgba(52, 152, 219, 0.8)',
                    color: '#fff',
                    '&:hover': {
                      backgroundColor: 'rgba(41, 128, 185, 0.9)',
                    },
                    borderRadius: '4px',
                  }}
                >
                  Create New Task
                </Button>
              </Box>
              <TaskTabs 
                tasks={tasks} 
                onEditTask={onEditTask}
                onDeleteTask={onDeleteTask}
                onTaskUpdated={onTaskUpdated}
              />
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <AssignedTasks
            title="Tasks Assigned to Me"
            icon={<AssignmentIndIcon sx={{ color: '#3498db' }} />}
            tasks={assignedToMeTasks}
            departments={departments}
            onEditTask={onEditTask}
            onDeleteTask={onDeleteTask}
          />
        </Grid>
        
        <Grid item xs={12} md={6}>
          <AssignedTasks
            title="Tasks Assigned by Me"
            icon={<AssignmentIcon sx={{ color: '#3498db' }} />}
            tasks={assignedByMeTasks}
            departments={departments}
            showAssignButton={true}
            onAssignTask={onAssignTask}
            onEditTask={onEditTask}
            onDeleteTask={onDeleteTask}
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default TaskManagementSection; 