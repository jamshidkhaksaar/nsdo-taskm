import React from 'react';
import { useQuery } from "@tanstack/react-query";
import { Box, Typography, Chip, Skeleton, Alert, Tooltip } from '@mui/material';
import { TaskService, TaskStatusCountsResponse } from '../../services/task'; // Import response type
import { TaskStatus } from '../../types';

interface UserStatusStatsProps {
  userId: string;
}

// Maintain display order and color logic
const statusDisplayOrder: TaskStatus[] = [
  TaskStatus.PENDING,
  TaskStatus.IN_PROGRESS,
  TaskStatus.COMPLETED,
  TaskStatus.CANCELLED,
];

const getStatusColor = (status: TaskStatus): "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning" => {
    switch (status) {
        case TaskStatus.PENDING: return "warning";
        case TaskStatus.IN_PROGRESS: return "info";
        case TaskStatus.COMPLETED: return "success";
        case TaskStatus.CANCELLED: return "error";
        default: return "default";
    }
};

// Helper to format status keys from the response (e.g., 'in_progress' -> 'In Progress')
const formatStatusKey = (key: string): string => {
    return key.split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
};

const UserStatusStats: React.FC<UserStatusStatsProps> = ({ userId }) => {
  const { 
    data: statusCounts,
    isLoading,
    error
  } = useQuery<TaskStatusCountsResponse, Error>({
    queryKey: ['userTaskStatusCounts', userId], 
    queryFn: () => TaskService.getTaskCountsByStatusForUser(userId),
    enabled: !!userId, // Only run query if userId is provided
    staleTime: 1 * 60 * 1000, // Cache for 1 minute
  });

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        {/* Adjust skeleton count/width if needed */}
        {[...Array(4)].map((_, index) => (
          <Skeleton key={index} variant="rectangular" width={100} height={24} />
        ))}
      </Box>
    );
  }

  if (error) {
    return <Alert severity="warning" sx={{ my: 1, fontSize: '0.8rem' }}>Could not load task stats.</Alert>;
  }

  if (!statusCounts || Object.keys(statusCounts).length === 0) {
    return <Typography variant="caption" color="text.secondary">No task stats available.</Typography>;
  }

  // Map TaskStatus enum values to string keys used in the response interface
  const statusKeyMap: Record<TaskStatus, keyof TaskStatusCountsResponse> = {
    [TaskStatus.PENDING]: 'pending',
    [TaskStatus.IN_PROGRESS]: 'in_progress',
    [TaskStatus.COMPLETED]: 'completed',
    [TaskStatus.CANCELLED]: 'cancelled',
  };

  // Calculate total using the response keys
  const totalTasks = Object.values(statusCounts).reduce((sum, count) => sum + (count || 0), 0);

  return (
    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center', my: 1 }}>
      <Typography variant="caption" sx={{ fontWeight: 'bold', mr: 1 }}>Assigned Tasks:</Typography>
      {statusDisplayOrder.map(status => {
        const statusKey = statusKeyMap[status];
        const count = statusCounts[statusKey] || 0;
        if (count === 0) return null; // Optionally hide statuses with 0 count
        
        const formattedLabel = formatStatusKey(statusKey);
        return (
          <Tooltip key={status} title={`${formattedLabel} Tasks`} arrow>
             <Chip 
               label={`${formattedLabel}: ${count}`} 
               size="small"
               color={getStatusColor(status)}
               variant="outlined"
            />
          </Tooltip>
        );
      })}
      {totalTasks > 0 && (
         <Typography variant="caption" sx={{ ml: 1, fontStyle: 'italic' }}>(Total Direct: {totalTasks})</Typography>
      )}
    </Box>
  );
};

export default UserStatusStats; 