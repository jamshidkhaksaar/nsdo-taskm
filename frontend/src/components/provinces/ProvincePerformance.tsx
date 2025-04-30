import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  Grid, 
  CircularProgress, 
  Alert 
} from '@mui/material';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { getProvincePerformance, getMultiProvincePerformance } from '../../services/provinceService';
import { getGlassmorphismStyles } from '@/utils/glassmorphismStyles';
import ProvinceSelector from './ProvinceSelector';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';
import { TaskStatus } from '@/types';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

interface PerformanceMetrics {
  avgCompletionTime: number;
  onTimeCompletionRate: number;
  overdueRate: number;
  taskVolume: number;
}

interface TaskStatusCount {
  status: TaskStatus;
  count: number;
}

interface ProvincePerformanceData {
  provinceId: string;
  provinceName: string;
  statusDistribution: TaskStatusCount[];
  metrics: PerformanceMetrics;
}

const TaskStatusColors = {
  [TaskStatus.PENDING]: 'rgba(255, 193, 7, 0.7)',
  [TaskStatus.IN_PROGRESS]: 'rgba(33, 150, 243, 0.7)',
  [TaskStatus.COMPLETED]: 'rgba(76, 175, 80, 0.7)',
  [TaskStatus.CANCELLED]: 'rgba(244, 67, 54, 0.7)',
  [TaskStatus.DELEGATED]: 'rgba(156, 39, 176, 0.7)'
};

const ProvincePerformance: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const [selectedProvinces, setSelectedProvinces] = useState<string[]>([]);
  const [performanceData, setPerformanceData] = useState<ProvincePerformanceData[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Load performance data for selected provinces (Hook called before conditional return)
  useEffect(() => {
    const fetchPerformanceData = async () => {
      if (selectedProvinces.length === 0) {
        setPerformanceData([]);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        let data;
        if (selectedProvinces.length === 1) {
          data = await getProvincePerformance(selectedProvinces[0]);
          setPerformanceData([data]);
        } else {
          const result = await getMultiProvincePerformance(selectedProvinces);
          setPerformanceData(result.provinces || []);
        }
      } catch (err) {
        console.error('Error fetching performance data:', err);
        setError('Failed to load performance data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchPerformanceData();
  }, [selectedProvinces]);

  // Only allow admin and leadership to see this component (Moved after hook calls)
  if (user?.role !== 'ADMIN' && user?.role !== 'LEADERSHIP') {
    return null;
  }

  // Prepare data for the task status distribution chart
  const getStatusDistributionData = () => {
    if (!performanceData.length) return null;

    const labels = Object.values(TaskStatus);
    const datasets = performanceData.map(province => {
      const statusCounts = {};
      
      // Initialize all statuses to 0
      labels.forEach(status => {
        statusCounts[status] = 0;
      });
      
      // Fill in actual counts
      province.statusDistribution.forEach(item => {
        statusCounts[item.status] = item.count;
      });
      
      return {
        label: province.provinceName,
        data: labels.map(status => statusCounts[status]),
        backgroundColor: labels.map(status => TaskStatusColors[status])
      };
    });

    return {
      labels,
      datasets
    };
  };

  // Prepare data for the performance metrics chart
  const getPerformanceMetricsData = () => {
    if (!performanceData.length) return null;

    return {
      labels: performanceData.map(p => p.provinceName),
      datasets: [
        {
          label: 'On-Time Completion Rate (%)',
          data: performanceData.map(p => p.metrics.onTimeCompletionRate),
          backgroundColor: 'rgba(76, 175, 80, 0.7)',
          borderColor: 'rgba(76, 175, 80, 1)',
          borderWidth: 1
        },
        {
          label: 'Overdue Rate (%)',
          data: performanceData.map(p => p.metrics.overdueRate),
          backgroundColor: 'rgba(244, 67, 54, 0.7)',
          borderColor: 'rgba(244, 67, 54, 1)',
          borderWidth: 1
        }
      ]
    };
  };

  // Metrics cards for a single province
  const renderMetricsCards = (province: ProvincePerformanceData) => {
    const { metrics } = province;
    
    return (
      <Grid container spacing={2}>
        <Grid item xs={6} md={3}>
          <Paper sx={{ ...getGlassmorphismStyles().card, p: 2, height: '100%' }}>
            <Typography variant="subtitle2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
              Task Volume
            </Typography>
            <Typography variant="h4" sx={{ color: '#fff' }}>
              {metrics.taskVolume}
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={6} md={3}>
          <Paper sx={{ ...getGlassmorphismStyles().card, p: 2, height: '100%' }}>
            <Typography variant="subtitle2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
              Avg. Completion Time
            </Typography>
            <Typography variant="h4" sx={{ color: '#fff' }}>
              {metrics.avgCompletionTime.toFixed(1)} hrs
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={6} md={3}>
          <Paper sx={{ ...getGlassmorphismStyles().card, p: 2, height: '100%' }}>
            <Typography variant="subtitle2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
              On-Time Rate
            </Typography>
            <Typography variant="h4" sx={{ color: '#fff' }}>
              {metrics.onTimeCompletionRate.toFixed(0)}%
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={6} md={3}>
          <Paper sx={{ ...getGlassmorphismStyles().card, p: 2, height: '100%' }}>
            <Typography variant="subtitle2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
              Overdue Rate
            </Typography>
            <Typography variant="h4" sx={{ color: '#fff' }}>
              {metrics.overdueRate.toFixed(0)}%
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    );
  };

  // Render single province performance
  const renderSingleProvincePerformance = () => {
    const province = performanceData[0];
    
    if (!province) return null;
    
    // Prepare pie chart data for task status distribution
    const pieData = {
      labels: province.statusDistribution.map(item => item.status),
      datasets: [
        {
          data: province.statusDistribution.map(item => item.count),
          backgroundColor: province.statusDistribution.map(item => TaskStatusColors[item.status]),
          borderWidth: 1
        }
      ]
    };
    
    return (
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Typography variant="h5" sx={{ color: '#fff', mb: 2 }}>
            Performance for {province.provinceName}
          </Typography>
        </Grid>
        
        <Grid item xs={12}>
          {renderMetricsCards(province)}
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper sx={{ ...getGlassmorphismStyles().card, p: 3 }}>
            <Typography variant="h6" sx={{ color: '#fff', mb: 2 }}>
              Task Status Distribution
            </Typography>
            <Box sx={{ height: 300 }}>
              <Pie data={pieData} options={{ maintainAspectRatio: false }} />
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper sx={{ ...getGlassmorphismStyles().card, p: 3 }}>
            <Typography variant="h6" sx={{ color: '#fff', mb: 2 }}>
              Task Completion Timeline
            </Typography>
            <Box sx={{ height: 300, opacity: 0.7 }}>
              <Typography sx={{ color: '#fff', textAlign: 'center', pt: 10 }}>
                Timeline visualization requires historical data
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    );
  };

  // Render multiple province comparison
  const renderMultiProvinceComparison = () => {
    const statusData = getStatusDistributionData();
    const metricsData = getPerformanceMetricsData();
    
    if (!statusData || !metricsData) return null;
    
    return (
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Typography variant="h5" sx={{ color: '#fff', mb: 2 }}>
            Province Performance Comparison
          </Typography>
        </Grid>
        
        <Grid item xs={12}>
          <Paper sx={{ ...getGlassmorphismStyles().card, p: 3 }}>
            <Typography variant="h6" sx={{ color: '#fff', mb: 2 }}>
              Task Status Distribution by Province
            </Typography>
            <Box sx={{ height: 300 }}>
              <Bar 
                data={statusData}
                options={{
                  maintainAspectRatio: false,
                  scales: {
                    y: {
                      beginAtZero: true,
                      grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                      },
                      ticks: {
                        color: 'rgba(255, 255, 255, 0.7)'
                      }
                    },
                    x: {
                      grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                      },
                      ticks: {
                        color: 'rgba(255, 255, 255, 0.7)'
                      }
                    }
                  }
                }}
              />
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12}>
          <Paper sx={{ ...getGlassmorphismStyles().card, p: 3 }}>
            <Typography variant="h6" sx={{ color: '#fff', mb: 2 }}>
              Performance Metrics Comparison
            </Typography>
            <Box sx={{ height: 300 }}>
              <Bar 
                data={metricsData}
                options={{
                  maintainAspectRatio: false,
                  scales: {
                    y: {
                      beginAtZero: true,
                      max: 100,
                      grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                      },
                      ticks: {
                        color: 'rgba(255, 255, 255, 0.7)'
                      }
                    },
                    x: {
                      grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                      },
                      ticks: {
                        color: 'rgba(255, 255, 255, 0.7)'
                      }
                    }
                  }
                }}
              />
            </Box>
          </Paper>
        </Grid>
      </Grid>
    );
  };

  return (
    <Box>
      <Paper sx={{ ...getGlassmorphismStyles().card, p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom sx={{ color: '#fff' }}>
          Province Performance Dashboard
        </Typography>
        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mb: 2 }}>
          Select one or more provinces to view performance metrics and statistics.
        </Typography>
        
        <ProvinceSelector
          multiple={true}
          onChange={(provinces) => setSelectedProvinces(provinces as string[])}
          selectedProvinces={selectedProvinces}
          title="Select Provinces to Analyze"
        />
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 5 }}>
          <CircularProgress />
        </Box>
      )}

      {!loading && !error && performanceData.length > 0 && (
        <Paper sx={{ ...getGlassmorphismStyles().card, p: 3 }}>
          {performanceData.length === 1
            ? renderSingleProvincePerformance()
            : renderMultiProvinceComparison()
          }
        </Paper>
      )}

      {!loading && !error && selectedProvinces.length > 0 && performanceData.length === 0 && (
        <Alert severity="info" sx={{ mb: 3 }}>
          No performance data available for the selected provinces.
        </Alert>
      )}
    </Box>
  );
};

export default ProvincePerformance; 