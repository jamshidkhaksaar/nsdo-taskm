import React, { useMemo } from 'react';
import { Box, Grid, Typography, LinearProgress, Tooltip, Stack } from '@mui/material';
import AssignmentIcon from '@mui/icons-material/Assignment';
import PendingIcon from '@mui/icons-material/Pending';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import { Task } from '../../types/task';

interface TaskSummaryProps {
  tasks: Task[];
  compact?: boolean;
}

interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  count: number;
  total: number;
  color: string;
  compact?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ icon, title, count, total, color, compact = false }) => {
  const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
  
  if (compact) {
    return (
      <Box
        sx={{
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(8px)',
          borderRadius: '8px',
          padding: '8px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        }}
      >
        <Box
          sx={{
            backgroundColor: `${color}20`,
            borderRadius: '6px',
            p: 0.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {React.cloneElement(icon as React.ReactElement, { sx: { color, fontSize: 18 } })}
        </Box>
        
        <Box>
          <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
            {title}
          </Typography>
          <Typography variant="body2" sx={{ color: '#fff', fontWeight: 600 }}>
            {count}
          </Typography>
        </Box>
      </Box>
    );
  }
  
  return (
    <Box
      sx={{
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(8px)',
        borderRadius: '8px',
        padding: '12px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 4px 8px 0 rgba(31, 38, 135, 0.15)',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        transition: 'transform 0.2s ease-in-out',
        '&:hover': {
          transform: 'translateY(-3px)',
        },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        <Box
          sx={{
            backgroundColor: `${color}20`,
            borderRadius: '6px',
            p: 0.75,
            mr: 1.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {React.cloneElement(icon as React.ReactElement, { sx: { color, fontSize: 20 } })}
        </Box>
        <Typography variant="body2" sx={{ color: '#fff', fontWeight: 500 }}>
          {title}
        </Typography>
      </Box>
      
      <Box sx={{ display: 'flex', alignItems: 'baseline', mb: 0.5 }}>
        <Typography variant="h6" sx={{ color: '#fff', fontWeight: 700 }}>
          {count}
        </Typography>
        <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)', ml: 0.5 }}>
          / {total}
        </Typography>
      </Box>
      
      <Tooltip title={`${percentage}% of total tasks`}>
        <Box sx={{ width: '100%' }}>
          <LinearProgress
            variant="determinate"
            value={percentage}
            sx={{
              height: 6,
              borderRadius: 3,
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              '& .MuiLinearProgress-bar': {
                backgroundColor: color,
                borderRadius: 3,
              },
            }}
          />
        </Box>
      </Tooltip>
    </Box>
  );
};

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

  // Ultra compact version for small spaces
  if (compact) {
    return (
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle1" sx={{ color: '#fff', mb: 1.5, fontWeight: 600 }}>
          Task Summary
        </Typography>
        
        <Stack direction="row" spacing={1} sx={{ overflowX: 'auto', pb: 1 }}>
          <StatCard
            icon={<AssignmentIcon />}
            title="Total"
            count={totalCount}
            total={totalCount}
            color="#3498db"
            compact
          />
          <StatCard
            icon={<PendingIcon />}
            title="Pending"
            count={pendingCount}
            total={totalCount}
            color="#f39c12"
            compact
          />
          <StatCard
            icon={<AccessTimeIcon />}
            title="In Progress"
            count={inProgressCount}
            total={totalCount}
            color="#9b59b6"
            compact
          />
          <StatCard
            icon={<CheckCircleIcon />}
            title="Completed"
            count={completedCount}
            total={totalCount}
            color="#2ecc71"
            compact
          />
          <StatCard
            icon={<CancelIcon />}
            title="Cancelled"
            count={cancelledCount}
            total={totalCount}
            color="#e74c3c"
            compact
          />
        </Stack>
      </Box>
    );
  }

  // Standard version but more compact than before
  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="subtitle1" sx={{ color: '#fff', mb: 2, fontWeight: 600 }}>
        Task Summary
      </Typography>
      
      <Grid container spacing={2}>
        <Grid item xs={6} sm={4} md={2.4}>
          <StatCard
            icon={<AssignmentIcon />}
            title="Total Tasks"
            count={totalCount}
            total={totalCount}
            color="#3498db"
          />
        </Grid>
        <Grid item xs={6} sm={4} md={2.4}>
          <StatCard
            icon={<PendingIcon />}
            title="Pending"
            count={pendingCount}
            total={totalCount}
            color="#f39c12"
          />
        </Grid>
        <Grid item xs={6} sm={4} md={2.4}>
          <StatCard
            icon={<AccessTimeIcon />}
            title="In Progress"
            count={inProgressCount}
            total={totalCount}
            color="#9b59b6"
          />
        </Grid>
        <Grid item xs={6} sm={4} md={2.4}>
          <StatCard
            icon={<CheckCircleIcon />}
            title="Completed"
            count={completedCount}
            total={totalCount}
            color="#2ecc71"
          />
        </Grid>
        <Grid item xs={6} sm={4} md={2.4}>
          <StatCard
            icon={<CancelIcon />}
            title="Cancelled"
            count={cancelledCount}
            total={totalCount}
            color="#e74c3c"
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default TaskSummary; 