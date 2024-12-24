import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Avatar,
  LinearProgress,
  Grid,
} from '@mui/material';

interface TopPerformer {
  id: string;
  name: string;
  avatar?: string;
  tasksCompleted: number;
  completionRate: number;
}

interface DepartmentSummaryProps {
  departmentName: string;
  totalTasks: number;
  completedTasks: number;
  ongoingTasks: number;
  upcomingTasks: number;
  topPerformers: TopPerformer[];
}

const DepartmentSummary: React.FC<DepartmentSummaryProps> = ({
  departmentName,
  totalTasks,
  completedTasks,
  ongoingTasks,
  upcomingTasks,
  topPerformers,
}) => {
  return (
    <Card
      sx={{
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(8px)',
        border: '1px solid rgba(255, 255, 255, 0.18)',
        borderRadius: 2,
        mb: 3,
      }}
    >
      <CardContent>
        <Typography variant="h6" sx={{ color: '#fff', mb: 2 }}>
          {departmentName} Summary
        </Typography>

        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={4}>
            <Box sx={{ textAlign: 'center', color: '#fff' }}>
              <Typography variant="h4">{totalTasks}</Typography>
              <Typography variant="body2">Total Tasks</Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={8}>
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" sx={{ color: '#fff' }}>
                  Overall Progress
                </Typography>
                <Typography variant="body2" sx={{ color: '#fff' }}>
                  {Math.round((completedTasks / totalTasks) * 100)}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={(completedTasks / totalTasks) * 100}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: '#4CAF50',
                  },
                }}
              />
            </Box>
          </Grid>
        </Grid>

        <Typography variant="h6" sx={{ color: '#fff', mb: 2 }}>
          Top Performers
        </Typography>
        <Grid container spacing={2}>
          {topPerformers.map((performer) => (
            <Grid item xs={12} sm={6} md={4} key={performer.id}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  p: 2,
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: 1,
                }}
              >
                <Avatar src={performer.avatar} alt={performer.name} />
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="body2" sx={{ color: '#fff' }}>
                    {performer.name}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                    {performer.tasksCompleted} tasks completed
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={performer.completionRate}
                    sx={{
                      mt: 1,
                      height: 4,
                      borderRadius: 2,
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: '#2196F3',
                      },
                    }}
                  />
                </Box>
              </Box>
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  );
};

export default DepartmentSummary; 