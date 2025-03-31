import React from 'react';
import { Box, Typography, Chip, alpha, useTheme } from '@mui/material';
import { Task, TaskStatus } from '../../types/task';
import TaskCard from './TaskCard';

// Define the props interface
interface KanbanColumnProps {
  title: string;
  tasks: Task[];
  status: string;
  onEditTask?: (taskId: string) => void;
  onDeleteTask?: (taskId: string) => void;
  onChangeTaskStatus?: (taskId: string, newStatus: TaskStatus) => Promise<boolean> | void;
  getUserName: (userId: string) => Promise<string>;
  formatDate?: (dateString: string) => string;
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({
  title,
  tasks,
  status,
  onEditTask,
  onDeleteTask,
  onChangeTaskStatus,
  getUserName,
  formatDate,
}) => {
  const theme = useTheme();

  // Get color for status
  const getStatusColor = (status: string, theme: any): string => {
    switch (status.toLowerCase()) {
      case 'pending':
        return theme.palette.warning.main;
      case 'in_progress':
        return theme.palette.info.main;
      case 'completed':
        return theme.palette.success.main;
      case 'cancelled':
        return theme.palette.grey[500];
      default:
        return theme.palette.grey[500];
    }
  };

  const statusColor = getStatusColor(status, theme);

  return (
    <Box
      sx={{
        height: '100%',
        bgcolor: alpha(theme.palette.background.paper, 0.05),
        borderRadius: 1.5,
        p: 1.5,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography 
          variant="h6" 
          sx={{ 
            color: statusColor, 
            fontWeight: 'bold', 
            fontSize: '1rem' 
          }}
        >
          {title}
        </Typography>
        <Chip 
          label={tasks.length} 
          size="small" 
          sx={{ 
            bgcolor: alpha(statusColor, 0.2),
            color: statusColor,
            fontWeight: 'bold',
            height: '20px',
            '& .MuiChip-label': {
              padding: '0 6px'
            }
          }} 
        />
      </Box>

      <Box sx={{ 
        flexGrow: 1, 
        overflowY: 'auto',
        minHeight: 0,
        '&::-webkit-scrollbar': {
          width: '6px'
        },
        '&::-webkit-scrollbar-track': {
          background: alpha(theme.palette.background.paper, 0.05)
        },
        '&::-webkit-scrollbar-thumb': {
          background: alpha(theme.palette.background.paper, 0.2),
          borderRadius: '3px'
        }
      }}>
        {tasks.map(task => (
          <TaskCard
            key={task.id}
            task={task}
            statusColor={statusColor}
            onEdit={onEditTask}
            onDelete={onDeleteTask}
            onChangeStatus={onChangeTaskStatus}
            getUserName={getUserName}
            formatDate={formatDate}
            theme={theme}
          />
        ))}
        {tasks.length === 0 && (
          <Box 
            sx={{ 
              height: '100%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              p: 2,
              color: alpha(theme.palette.text.primary, 0.4),
              fontSize: '0.875rem'
            }}
          >
            No tasks
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default KanbanColumn; 