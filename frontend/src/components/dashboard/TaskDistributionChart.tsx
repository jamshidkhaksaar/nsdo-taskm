import React, { useEffect, useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CircularProgress, 
  Typography, 
  Box, 
  Grid,
  Paper
} from '@mui/material';
import axios from 'axios';
import { API_BASE_URL, CHART_COLORS } from '../../constants';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, Title } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import HeatMap from 'react-heatmap-grid';

// Register ChartJS components
ChartJS.register(ArcElement, Tooltip, Legend, Title);

interface TaskDistributionChartProps {}

const TaskDistributionChart: React.FC<TaskDistributionChartProps> = () => {
  const [distribution, setDistribution] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'departments' | 'heatmap'>('departments');

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const { data } = await axios.get(`${API_BASE_URL}/analytics/task-distribution`);
        setDistribution(data);
      } catch (err) {
        console.error('Error fetching task distribution:', err);
        setError('Failed to load task distribution data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const prepareDepartmentChartData = () => {
    if (!distribution?.tasksByCategory) return null;
    
    const categoryColors = Object.values(CHART_COLORS);
    
    const labels = distribution.tasksByCategory.map((item: any) => item.category || 'Uncategorized');
    const data = distribution.tasksByCategory.map((item: any) => item.count);
    
    // Assign colors in a cycle
    const backgroundColor = distribution.tasksByCategory.map((_: any, index: number) => 
      categoryColors[index % categoryColors.length]
    );
    
    return {
      labels,
      datasets: [
        {
          data,
          backgroundColor,
          borderColor: backgroundColor,
          borderWidth: 1,
          hoverOffset: 10,
        },
      ],
    };
  };

  const prepareHeatmapData = () => {
    if (!distribution?.heatmapData || distribution.heatmapData.length === 0) {
      return null;
    }
    
    // Initialize heatmap data
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const hours = Array.from({ length: 24 }, (_, i) => `${i}:00`);
    
    // Create a 7x24 array filled with zeros
    const heatmapData = Array(7)
      .fill(0)
      .map(() => Array(24).fill(0));
    
    // Fill in the data
    distribution.heatmapData.forEach((item: any) => {
      const dayIndex = item.dayOfWeek - 1; // Adjust if needed based on your data
      const hourIndex = item.hour;
      
      if (dayIndex >= 0 && dayIndex < 7 && hourIndex >= 0 && hourIndex < 24) {
        heatmapData[dayIndex][hourIndex] = item.count;
      }
    });
    
    return {
      xLabels: hours.filter((_, i) => i % 3 === 0), // Show every 3 hours for better display
      yLabels: days,
      data: heatmapData.map(row => row.filter((_, i) => i % 3 === 0)) // Keep in sync with xLabels
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
          padding: 10,
          font: {
            size: 10
          }
        },
      },
      title: {
        display: true,
        text: 'Tasks by Department',
        font: {
          size: 14
        }
      },
    },
    cutout: '60%',
  };

  const renderTasksByDepartment = () => {
    const chartData = prepareDepartmentChartData();
    
    if (!chartData) {
      return (
        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', mt: 1 }}>
          No department distribution data available
        </Typography>
      );
    }
    
    return (
      <Box sx={{ height: 260, position: 'relative' }}>
        <Doughnut data={chartData} options={chartOptions} />
      </Box>
    );
  };

  const renderHeatmap = () => {
    const heatmapData = prepareHeatmapData();
    
    if (!heatmapData) {
      return (
        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', mt: 1 }}>
          No activity heatmap data available
        </Typography>
      );
    }
    
    return (
      <Box sx={{ height: 240, position: 'relative', overflow: 'auto' }}>
        <Typography variant="subtitle2" align="center" gutterBottom>
          Activity Heatmap
        </Typography>
        <HeatMap 
          xLabels={heatmapData.xLabels}
          yLabels={heatmapData.yLabels}
          data={heatmapData.data}
          cellStyle={(background: string, value: number, min: number, max: number) => ({
            background: `rgba(66, 86, 244, ${(value - min) / (max - min) || 0})`,
            fontSize: '11px',
            color: value > (max - min) / 1.5 ? '#fff' : '#000'
          })}
          cellRender={(value: number) => value && <div>{value}</div>}
        />
      </Box>
    );
  };

  const renderSummary = () => {
    if (!distribution) return null;
    
    return (
      <Grid container spacing={2} sx={{ mt: 1 }}>
        <Grid item xs={6}>
          <Paper 
            elevation={0} 
            sx={{ 
              p: 1, 
              textAlign: 'center', 
              bgcolor: 'info.light',
              color: 'info.contrastText',
              borderRadius: 2
            }}
          >
            <Typography variant="h6">{distribution.upcomingTasks || 0}</Typography>
            <Typography variant="caption">Upcoming</Typography>
          </Paper>
        </Grid>
        <Grid item xs={6}>
          <Paper 
            elevation={0} 
            sx={{ 
              p: 1, 
              textAlign: 'center', 
              bgcolor: 'error.light',
              color: 'error.contrastText',
              borderRadius: 2
            }}
          >
            <Typography variant="h6">{distribution.overdueTasks || 0}</Typography>
            <Typography variant="caption">Overdue</Typography>
          </Paper>
        </Grid>
      </Grid>
    );
  };

  return (
    <Card sx={{ height: '100%', boxShadow: 3 }}>
      <CardHeader 
        title="Task Distribution" 
        titleTypographyProps={{ variant: 'h6' }}
        sx={{ 
          backgroundColor: 'primary.light', 
          color: 'primary.contrastText',
          pb: 1 
        }}
      />
      <CardContent sx={{ height: 300, position: 'relative' }}>
        {isLoading ? (
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            height: '100%'
          }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            height: '100%',
            flexDirection: 'column'
          }}>
            <Typography color="error" variant="body1">
              {error}
            </Typography>
          </Box>
        ) : (
          <Box sx={{ height: '100%' }}>
            {activeView === 'departments' ? renderTasksByDepartment() : renderHeatmap()}
            {renderSummary()}
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default TaskDistributionChart; 