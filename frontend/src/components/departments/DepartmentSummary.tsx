import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Avatar,
  LinearProgress,
  Grid,
  SxProps,
  keyframes,
} from '@mui/material';

const fillAnimation = keyframes`
  from {
    width: 0%;
  }
  to {
    width: 100%;
  }
`;

const numberAnimation = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

interface TopPerformer {
  id: string;
  name: string;
  avatar?: string;
  tasksCompleted: number;
  completionRate: number;
  sx?: {
    completionRate?: React.CSSProperties;
    progressBar?: SxProps;
  };
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
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: '#fff',
                    animation: `${numberAnimation} 0.8s ease-out forwards`,
                  }}
                >
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
                    animation: `${fillAnimation} 1.2s ease-out`,
                    transformOrigin: 'left',
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
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: '#fff',
                      ...performer.sx?.completionRate 
                    }}
                  >
                    {performer.completionRate}%
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={performer.completionRate}
                    sx={{
                      width: 100,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: '#4CAF50',
                      },
                      ...performer.sx?.progressBar,
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