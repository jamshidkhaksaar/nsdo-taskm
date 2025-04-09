import React from 'react';
import { Grid, Card, CardContent, Typography, Box, LinearProgress } from '@mui/material';
import AssignmentIcon from '@mui/icons-material/Assignment';

interface Department {
  id: string;
  name: string;
  taskCount: number;
  completedTasks: number;
  completionRate: number;
}

interface DepartmentStatsProps {
  departmentData: Department[];
}

const DepartmentStats: React.FC<DepartmentStatsProps> = ({ departmentData }) => (
  <Grid container spacing={3} mb={4}>
    {departmentData.map((dept) => (
      <Grid item xs={12} sm={6} md={3} key={dept.id}>
        <Card sx={{
          background: 'linear-gradient(to right, rgba(25, 118, 210, 0.2), rgba(25, 118, 210, 0.4))',
          border: '1px solid rgba(25, 118, 210, 0.3)',
          borderRadius: 2,
          height: '100%',
        }}>
          <CardContent>
            <Typography variant="overline" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
              {dept.name}
            </Typography>
            <Box display="flex" alignItems="center" gap={1} mt={1}>
              <AssignmentIcon sx={{ color: '#90caf9', fontSize: 36 }} />
              <Typography variant="h4" sx={{ color: '#fff', fontWeight: 'bold' }}>
                {dept.taskCount}
              </Typography>
            </Box>
            <Box mt={2}>
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                  Completed
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                  {dept.completionRate}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={dept.completionRate}
                sx={{
                  height: 8,
                  borderRadius: 5,
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: '#4caf50',
                  },
                }}
              />
            </Box>
          </CardContent>
        </Card>
      </Grid>
    ))}
  </Grid>
);

export default DepartmentStats;