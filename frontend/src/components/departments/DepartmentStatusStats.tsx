import React from 'react';
import { useQuery } from "@tanstack/react-query";
import { Box, Typography, Chip, Skeleton, Alert, Tooltip } from '@mui/material';
import { TaskService } from '../../services/task';
import { TaskStatus } from '../../types';

// Explicitly define the structure for counts
interface TaskStatusCountsResponse {
  [TaskStatus.PENDING]: number;
  [TaskStatus.IN_PROGRESS]: number;
  [TaskStatus.COMPLETED]: number;
  [TaskStatus.CANCELLED]: number;
  // No DELEGATED here
}

interface DepartmentStatusStatsProps {
  departmentId: string;
}

const statusDisplayOrder: TaskStatus[] = [
  TaskStatus.PENDING,
  TaskStatus.IN_PROGRESS,
  TaskStatus.COMPLETED,
  TaskStatus.CANCELLED,
];

// Helper to get color (reuse from TaskViewDialog or define locally)
const getStatusColor = (status: TaskStatus): "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning" => {
    switch (status) {
        case TaskStatus.PENDING: return "warning";
        case TaskStatus.IN_PROGRESS: return "info";
        case TaskStatus.COMPLETED: return "success";
        case TaskStatus.CANCELLED: return "error";
        // Add DELEGATED if needed and exists in frontend enum
        // case TaskStatus.DELEGATED: return "secondary"; 
        default: return "default";
    }
};

const DepartmentStatusStats: React.FC<DepartmentStatusStatsProps> = ({ departmentId }) => {
  const { 
    data: statusCounts,
    isLoading,
    error
  } = useQuery<TaskStatusCountsResponse, Error>({
    queryKey: ['departmentTaskStatusCounts', departmentId], 
    queryFn: () => TaskService.getTaskCountsByStatusForDepartment(departmentId),
    enabled: !!departmentId, // Only run query if departmentId is provided
    staleTime: 1 * 60 * 1000, // Cache for 1 minute
  });

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        {statusDisplayOrder.map(status => (
          <Skeleton key={status} variant="rectangular" width={100} height={24} />
        ))}
      </Box>
    );
  }

  if (error) {
    return <Alert severity="warning" sx={{ my: 1, fontSize: '0.8rem' }}>Could not load task stats.</Alert>;
  }

  if (!statusCounts) {
    return <Typography variant="caption" color="text.secondary">No task stats available.</Typography>;
  }

  // Calculate total for percentage or display
  const totalTasks = statusDisplayOrder.reduce((sum, status) => sum + (statusCounts[status] || 0), 0);

  return (
    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center', my: 1 }}>
      <Typography variant="caption" sx={{ fontWeight: 'bold', mr: 1 }}>Tasks:</Typography>
      {statusDisplayOrder.map(status => {
        const count = statusCounts[status] || 0;
        if (count === 0) return null; // Optionally hide statuses with 0 count
        return (
          <Tooltip key={status} title={`${status.charAt(0).toUpperCase() + status.slice(1).toLowerCase().replace('_', ' ')} Tasks`} arrow>
             <Chip 
               label={`${status.charAt(0).toUpperCase() + status.slice(1).toLowerCase().replace('_', ' ')}: ${count}`} 
               size="small"
               color={getStatusColor(status)}
               variant="outlined"
              //  icon={ /* Optional: Add icon based on status */ }
            />
          </Tooltip>
        );
      })}
      {totalTasks > 0 && (
         <Typography variant="caption" sx={{ ml: 1, fontStyle: 'italic' }}>(Total: {totalTasks})</Typography>
      )}
    </Box>
  );
};

export default DepartmentStatusStats; 