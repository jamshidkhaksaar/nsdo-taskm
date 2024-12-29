import React from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  IconButton,
  LinearProgress,
  keyframes,
} from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import BusinessIcon from '@mui/icons-material/Business';
import AssignmentIcon from '@mui/icons-material/Assignment';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AdminLayout from '../../layouts/AdminLayout';

const fillNumberAnimation = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const progressFill = keyframes`
  from {
    width: 0%;
  }
  to {
    width: 100%;
  }
`;

const AdminDashboard: React.FC = () => {
  return (
    <AdminLayout>
      <Typography variant="h4" sx={{ color: '#fff', mb: 4 }}>
        Admin Dashboard
      </Typography>

      <Grid container spacing={3}>
        {/* Total Users Card */}
        <Grid item xs={12} md={6} lg={3}>
          <Card sx={{
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255, 255, 255, 0.18)',
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6" sx={{ color: '#fff' }}>
                  Total Users
                </Typography>
                <IconButton sx={{ color: '#fff', background: 'rgba(255, 255, 255, 0.1)' }}>
                  <PeopleIcon />
                </IconButton>
              </Box>
              <Typography variant="h3" sx={{ color: '#fff', mb: 1 }}>
                150
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                +12 new users this month
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Total Departments Card */}
        <Grid item xs={12} md={6} lg={3}>
          <Card sx={{
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255, 255, 255, 0.18)',
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6" sx={{ color: '#fff' }}>
                  Departments
                </Typography>
                <IconButton sx={{ color: '#fff', background: 'rgba(255, 255, 255, 0.1)' }}>
                  <BusinessIcon />
                </IconButton>
              </Box>
              <Typography variant="h3" sx={{ color: '#fff', mb: 1 }}>
                8
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                Active departments
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Active Tasks Card */}
        <Grid item xs={12} md={6} lg={3}>
          <Card sx={{
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255, 255, 255, 0.18)',
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6" sx={{ color: '#fff' }}>
                  Active Tasks
                </Typography>
                <IconButton sx={{ color: '#fff', background: 'rgba(255, 255, 255, 0.1)' }}>
                  <AssignmentIcon />
                </IconButton>
              </Box>
              <Typography variant="h3" sx={{ color: '#fff', mb: 1 }}>
                45
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                15 tasks completed today
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* System Performance Card */}
        <Grid item xs={12} md={6} lg={3}>
          <Card sx={{
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255, 255, 255, 0.18)',
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6" sx={{ color: '#fff' }}>
                  System Load
                </Typography>
                <IconButton sx={{ color: '#fff', background: 'rgba(255, 255, 255, 0.1)' }}>
                  <TrendingUpIcon />
                </IconButton>
              </Box>
              <Typography 
                variant="h3" 
                sx={{ 
                  color: '#fff', 
                  mb: 1,
                  animation: `${fillNumberAnimation} 0.8s ease-out forwards`,
                }}
              >
                85%
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={85}
                sx={{
                  width: 100,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: '#4CAF50',
                    animation: `${progressFill} 1.2s ease-out`,
                    transformOrigin: 'left',
                  },
                }}
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Activity Section */}
        <Grid item xs={12} md={6}>
          <Card sx={{
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255, 255, 255, 0.18)',
          }}>
            <CardContent>
              <Typography variant="h6" sx={{ color: '#fff', mb: 2 }}>
                Recent Activity
              </Typography>
              {/* Add activity list here */}
            </CardContent>
          </Card>
        </Grid>

        {/* System Health Section */}
        <Grid item xs={12} md={6}>
          <Card sx={{
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255, 255, 255, 0.18)',
          }}>
            <CardContent>
              <Typography variant="h6" sx={{ color: '#fff', mb: 2 }}>
                System Health
              </Typography>
              {/* Add system health metrics here */}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </AdminLayout>
  );
};

export default AdminDashboard; 