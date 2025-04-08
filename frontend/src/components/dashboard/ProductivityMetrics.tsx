import React, { useEffect, useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CircularProgress, 
  Grid, 
  Typography, 
  Box, 
  Chip,
  Divider,
  Alert,
  Skeleton
} from '@mui/material';
import axios from 'axios';
import { API_BASE_URL, CHART_COLORS } from '../../constants';
import { Pie } from 'react-chartjs-2';
import { 
  Chart as ChartJS, 
  ArcElement, 
  Tooltip, 
  Legend 
} from 'chart.js';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import PendingIcon from '@mui/icons-material/Pending';
import TimerIcon from '@mui/icons-material/Timer';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

// Register ChartJS components
ChartJS.register(ArcElement, Tooltip, Legend);

interface ProductivityMetricsProps {
  period?: 'daily' | 'weekly' | 'monthly';
}

// Skeleton component for loading state
const LoadingSkeleton = () => (
  <Grid container spacing={2} height="100%">
    <Grid item xs={12} md={6}>
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', p: 1 }}>
        <Skeleton variant="circular" width={80} height={80} sx={{ mb: 1 }} />
        <Skeleton variant="text" width="80%" sx={{ mb: 2 }} />
        <Divider flexItem sx={{ my: 2 }} />
        <Skeleton variant="rectangular" width="90%" height={40} sx={{ mb: 2 }} />
        <Divider flexItem sx={{ my: 2 }} />
        <Box display="flex" justifyContent="space-around" width="100%">
          <Skeleton variant="rounded" width="40%" height={40} />
          <Skeleton variant="rounded" width="40%" height={40} />
        </Box>
      </Box>
    </Grid>
    <Grid item xs={12} md={6}>
      <Box sx={{ height: 260, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <Skeleton variant="text" width="60%" sx={{ mb: 1 }}/>
        <Skeleton variant="circular" width={180} height={180} />
      </Box>
    </Grid>
  </Grid>
);

const ProductivityMetrics: React.FC<ProductivityMetricsProps> = ({ period = 'weekly' }) => {
  const [metrics, setMetrics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const { data } = await axios.get(`${API_BASE_URL}/analytics/completion-rate?period=${period}`);
        setMetrics(data);
      } catch (err) {
        console.error('Error fetching productivity metrics:', err);
        setError('Failed to load productivity metrics. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [period]);

  // Prepare pie chart data for tasks by priority
  const preparePriorityChartData = () => {
    if (!metrics || !metrics.tasksByPriority) return null;
    
    const priorityColors = {
      'High': CHART_COLORS.danger,
      'Medium': CHART_COLORS.warning,
      'Low': CHART_COLORS.info,
    };
    
    const labels = metrics.tasksByPriority.map((item: any) => item.priority);
    const data = metrics.tasksByPriority.map((item: any) => item.count);
    const backgroundColor = metrics.tasksByPriority.map((item: any) => 
      priorityColors[item.priority as keyof typeof priorityColors] || CHART_COLORS.secondary
    );
    
    return {
      labels,
      datasets: [
        {
          data,
          backgroundColor,
          borderColor: backgroundColor,
          borderWidth: 1,
        },
      ],
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          boxWidth: 15,
          padding: 15,
        },
      },
    },
  };

  const renderCompletionRate = () => {
    if (!metrics) return null;
    
    const completionRate = metrics.completionRate || 0;
    let color = 'success.main';
    
    if (completionRate < 30) {
      color = 'error.main';
    } else if (completionRate < 70) {
      color = 'warning.main';
    }
    
    return (
      <Box display="flex" flexDirection="column" alignItems="center">
        <Typography variant="h4" color={color} fontWeight="bold">
          {completionRate.toFixed(1)}%
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Completion Rate
        </Typography>
      </Box>
    );
  };

  const renderCompletionTime = () => {
    if (!metrics) return null;
    
    const avgDays = metrics.avgCompletionTime || 0;
    
    return (
      <Box display="flex" flexDirection="column" alignItems="center">
        <Box display="flex" alignItems="center">
          <TimerIcon sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h5" fontWeight="medium">
            {avgDays.toFixed(1)} days
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary">
          Avg. Completion Time
        </Typography>
      </Box>
    );
  };

  const renderTaskCounts = () => {
    if (!metrics) return null;
    
    return (
      <Box display="flex" justifyContent="space-around" width="100%">
        <Box display="flex" flexDirection="column" alignItems="center">
          <Chip 
            icon={<CheckCircleOutlineIcon />} 
            label={metrics.completedCount || 0} 
            color="success" 
            variant="outlined"
            sx={{ fontSize: '1.1rem', fontWeight: 'bold', p: 1 }}
          />
          <Typography variant="body2" color="text.secondary" mt={1}>
            Completed
          </Typography>
        </Box>
        
        <Box display="flex" flexDirection="column" alignItems="center">
          <Chip 
            icon={<PendingIcon />} 
            label={metrics.totalCount - metrics.completedCount || 0} 
            color="warning" 
            variant="outlined"
            sx={{ fontSize: '1.1rem', fontWeight: 'bold', p: 1 }}
          />
          <Typography variant="body2" color="text.secondary" mt={1}>
            Pending
          </Typography>
        </Box>
      </Box>
    );
  };

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', boxShadow: 3 }}>
      <CardHeader 
        title="Productivity Metrics" 
        titleTypographyProps={{ variant: 'h6' }}
        sx={{ 
          backgroundColor: 'primary.light', 
          color: 'primary.contrastText',
          pb: 1 
        }}
      />
      <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        {isLoading ? (
          <LoadingSkeleton />
        ) : error ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <ErrorOutlineIcon color="error" sx={{ fontSize: 40, mb: 1 }} />
            <Typography color="error" variant="body1" align="center">
              {error}
            </Typography>
          </Box>
        ) : metrics ? (
          <Grid container spacing={2} height="100%">
            <Grid item xs={12} md={6}>
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center',
                justifyContent: 'space-between',
                height: '100%',
                p: 1,
              }}>
                {renderCompletionRate()}
                
                <Divider flexItem sx={{ my: 2 }} />
                
                {renderCompletionTime()}
                
                <Divider flexItem sx={{ my: 2 }} />
                
                {renderTaskCounts()}
              </Box>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Box sx={{ height: 260, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                {preparePriorityChartData() ? (
                  <>
                    <Typography variant="subtitle2" align="center" gutterBottom sx={{ mt: 1 }}>
                      Tasks by Priority
                    </Typography>
                    <Box sx={{ flexGrow: 1, width: '100%', maxWidth: 250 }}>
                      <Pie data={preparePriorityChartData()!} options={chartOptions} />
                    </Box>
                  </>
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', mt: 4 }}>
                    No priority data
                  </Typography>
                )}
              </Box>
            </Grid>
          </Grid>
        ) : (
           <Typography color="text.secondary" align="center">No data available.</Typography>
        )}
      </CardContent>
    </Card>
  );
};

export default ProductivityMetrics; 