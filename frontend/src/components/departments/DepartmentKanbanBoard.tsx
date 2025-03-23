import React from 'react';
import { Box, Paper, Typography, Grid } from '@mui/material';
import { Task, TaskStatus } from '../../types/task';
import TaskCard from '../tasks/TaskCard';

interface DepartmentKanbanBoardProps {
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
  currentUserId: number;
}

const DepartmentKanbanBoard: React.FC<DepartmentKanbanBoardProps> = ({
  tasks,
  onTaskClick,
  currentUserId
}) => {
  // Filter tasks by status
  const pendingTasks = tasks.filter(task => task.status === TaskStatus.PENDING);
  const inProgressTasks = tasks.filter(task => task.status === TaskStatus.IN_PROGRESS);
  const completedTasks = tasks.filter(task => task.status === TaskStatus.COMPLETED);

  const renderColumn = (title: string, columnTasks: Task[], color: string) => (
    <Grid item xs={12} md={4}>
      <Paper
        elevation={0}
        sx={{
          backgroundColor: 'rgba(17, 25, 40, 0.7)',
          borderTop: `3px solid ${color}`,
          borderRadius: 2,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Box p={2} borderBottom="1px solid rgba(255, 255, 255, 0.1)">
          <Typography variant="subtitle1" fontWeight="bold" color="#fff">
            {title} ({columnTasks.length})
          </Typography>
        </Box>
        <Box p={2} sx={{ overflowY: 'auto', flexGrow: 1, maxHeight: '500px' }}>
          {columnTasks.length > 0 ? (
            columnTasks.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                onClick={() => onTaskClick && onTaskClick(task)}
                currentUserId={currentUserId}
              />
            ))
          ) : (
            <Box
              sx={{
                minHeight: 100,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 1,
                border: '1px dashed rgba(255, 255, 255, 0.1)',
                p: 2,
              }}
            >
              <Typography variant="body2" color="rgba(255, 255, 255, 0.5)">
                No tasks
              </Typography>
            </Box>
          )}
        </Box>
      </Paper>
    </Grid>
  );

  return (
    <Box mt={3}>
      <Typography variant="h6" fontWeight="bold" color="#fff" mb={2}>
        Task Board
      </Typography>
      <Grid container spacing={2}>
        {renderColumn('To Do', pendingTasks, '#1976d2')}
        {renderColumn('In Progress', inProgressTasks, '#ff9800')}
        {renderColumn('Completed', completedTasks, '#4caf50')}
      </Grid>
    </Box>
  );
};

export default DepartmentKanbanBoard; 