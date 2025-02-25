import React, { useMemo } from 'react';
import { Grid } from '@mui/material';
import TaskStatCard from './TaskStatCard';
import AssignmentIcon from '@mui/icons-material/Assignment';
import PendingIcon from '@mui/icons-material/Pending';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DeleteIcon from '@mui/icons-material/Delete';
import { Task } from '../../types/task';

interface TaskOverviewProps {
  tasks: Task[];
}

const TaskOverview: React.FC<TaskOverviewProps> = ({ tasks }) => {
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

  return (
    <Grid container spacing={2}>
      <Grid item xs={12} sm={6} md={2.4}>
        <TaskStatCard
          title="Total Tasks"
          value={totalCount.toString()}
          icon={<AssignmentIcon sx={{ color: '#fff' }} />}
          color="rgba(52, 152, 219, 0.8)"
          textColor="#fff"
        />
      </Grid>
      <Grid item xs={12} sm={6} md={2.4}>
        <TaskStatCard
          title="Pending"
          value={pendingCount.toString()}
          icon={<PendingIcon sx={{ color: '#fff' }} />}
          color="rgba(241, 196, 15, 0.8)"
          textColor="#fff"
        />
      </Grid>
      <Grid item xs={12} sm={6} md={2.4}>
        <TaskStatCard
          title="In Progress"
          value={inProgressCount.toString()}
          icon={<AccessTimeIcon sx={{ color: '#fff' }} />}
          color="rgba(155, 89, 182, 0.8)"
          textColor="#fff"
        />
      </Grid>
      <Grid item xs={12} sm={6} md={2.4}>
        <TaskStatCard
          title="Completed"
          value={completedCount.toString()}
          icon={<CheckCircleIcon sx={{ color: '#fff' }} />}
          color="rgba(46, 204, 113, 0.8)"
          textColor="#fff"
        />
      </Grid>
      <Grid item xs={12} sm={6} md={2.4}>
        <TaskStatCard
          title="Cancelled"
          value={cancelledCount.toString()}
          icon={<DeleteIcon sx={{ color: '#fff' }} />}
          color="rgba(231, 76, 60, 0.8)"
          textColor="#fff"
        />
      </Grid>
    </Grid>
  );
};

export default TaskOverview; 