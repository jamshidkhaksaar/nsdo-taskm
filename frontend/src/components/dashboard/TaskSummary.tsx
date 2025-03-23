import React, { useMemo } from 'react';
import { Box, Typography, Stack, Divider } from '@mui/material';
import PendingIcon from '@mui/icons-material/Pending';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import { Task } from '../../types/task';

interface TaskSummaryProps {
  tasks: Task[];
  compact?: boolean;
}

const TaskSummary: React.FC<TaskSummaryProps> = ({ tasks, compact = false }) => {
  // Memoize task counts to prevent unnecessary recalculations
  const {
    totalCount,
    pendingCount,
    inProgressCount,
    completedCount,
    cancelledCount
  } = useMemo(() => {
    return {
      totalCount: tasks.length,
      pendingCount: tasks.filter(task => task.status === 'pending').length,
      inProgressCount: tasks.filter(task => task.status === 'in_progress').length,
      completedCount: tasks.filter(task => task.status === 'completed').length,
      cancelledCount: tasks.filter(task => task.status === 'cancelled').length
    };
  }, [tasks]);

  // Super compact horizontal layout
  return (
    <Box 
      sx={{ 
        width: '100%', 
        mb: { xs: 1.5, sm: 1 },
        backgroundColor: 'rgba(30, 41, 59, 0.8)',
        borderRadius: '8px',
        overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        // Removed duplicate border
        border: 'none',
        p: { xs: 1, sm: 1.5 }
      }}
    >
      <Stack 
        direction={{ xs: 'column', sm: 'row' }} 
        divider={<Divider orientation="vertical" flexItem sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} />}
        spacing={2}
        alignItems="center"
        justifyContent="space-between"
        flexWrap="wrap"
      >
        <Box sx={{ minWidth: 100, width: { xs: '100%', sm: 'auto' }, mb: { xs: 1, sm: 0 } }}>
          <Typography variant="subtitle2" sx={{ color: '#fff', fontWeight: 500, mb: 0.5 }}>
            Task Summary
          </Typography>
          <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
            {totalCount} total tasks
          </Typography>
        </Box>
        
        <Stack direction="row" spacing={2} divider={<Divider orientation="vertical" flexItem sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} />} flexWrap="wrap" justifyContent="center">
          {/* Pending */}
          <Stack direction="row" alignItems="center" spacing={1} sx={{ py: 0.5 }}>
            <PendingIcon sx={{ color: '#f39c12', fontSize: 18 }} />
            <Stack>
              <Typography variant="body2" sx={{ color: '#fff', fontWeight: 600, lineHeight: 1.1 }}>
                {pendingCount}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)', lineHeight: 1 }}>
                Pending
              </Typography>
            </Stack>
          </Stack>
          
          {/* In Progress */}
          <Stack direction="row" alignItems="center" spacing={1} sx={{ py: 0.5 }}>
            <AccessTimeIcon sx={{ color: '#9b59b6', fontSize: 18 }} />
            <Stack>
              <Typography variant="body2" sx={{ color: '#fff', fontWeight: 600, lineHeight: 1.1 }}>
                {inProgressCount}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)', lineHeight: 1 }}>
                In Progress
              </Typography>
            </Stack>
          </Stack>
          
          {/* Completed */}
          <Stack direction="row" alignItems="center" spacing={1} sx={{ py: 0.5 }}>
            <CheckCircleIcon sx={{ color: '#2ecc71', fontSize: 18 }} />
            <Stack>
              <Typography variant="body2" sx={{ color: '#fff', fontWeight: 600, lineHeight: 1.1 }}>
                {completedCount}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)', lineHeight: 1 }}>
                Completed
              </Typography>
            </Stack>
          </Stack>
          
          {/* Cancelled */}
          <Stack direction="row" alignItems="center" spacing={1} sx={{ py: 0.5 }}>
            <CancelIcon sx={{ color: '#e74c3c', fontSize: 18 }} />
            <Stack>
              <Typography variant="body2" sx={{ color: '#fff', fontWeight: 600, lineHeight: 1.1 }}>
                {cancelledCount}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)', lineHeight: 1 }}>
                Cancelled
              </Typography>
            </Stack>
          </Stack>
        </Stack>
      </Stack>
    </Box>
  );
};

export default TaskSummary;