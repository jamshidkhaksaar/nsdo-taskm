import React from 'react';
import { Chip, useTheme } from '@mui/material';
import { TaskStatus } from '../../types/task';

interface TaskStatusBadgeProps {
  status: TaskStatus;
  size?: 'small' | 'medium';
}

const TaskStatusBadge: React.FC<TaskStatusBadgeProps> = ({ 
  status, 
  size = 'small' 
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
  
  // Get label for status
  const getStatusLabel = (status: string): string => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'Pending';
      case 'in_progress':
        return 'In Progress';
      case 'completed':
        return 'Completed';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
    }
  };
  
  const statusColor = getStatusColor(status, theme);
  
  return (
    <Chip 
      label={getStatusLabel(status)} 
      size={size} 
      sx={{ 
        bgcolor: `${statusColor}20`,
        color: statusColor,
        fontWeight: 500,
        borderRadius: '4px',
        height: size === 'small' ? '20px' : '24px',
        '& .MuiChip-label': {
          px: size === 'small' ? 1 : 1.5
        }
      }} 
    />
  );
};

export default TaskStatusBadge; 