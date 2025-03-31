import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartOptions,
} from 'chart.js';
import axios from 'axios';
import { API_BASE_URL } from '../../constants';
import { Card, CardContent, CardHeader, CircularProgress, Typography } from '@mui/material';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface CompletionRateChartProps {
  period?: 'daily' | 'weekly' | 'monthly';
}

const CompletionRateChart: React.FC<CompletionRateChartProps> = ({ period = 'weekly' }) => {
  const [chartData, setChartData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const { data } = await axios.get(`${API_BASE_URL}/analytics/productivity`);
        
        if (!data || !data.dailyCompletionTrend || data.dailyCompletionTrend.length === 0) {
          setError('No task completion data available');
          setIsLoading(false);
          return;
        }
        
        // Format dates for display
        const formattedData = data.dailyCompletionTrend.map((item: any) => ({
          date: new Date(item.date).toLocaleDateString(),
          count: item.count,
        }));
        
        // Prepare chart data
        setChartData({
          labels: formattedData.map((item: any) => item.date),
          datasets: [
            {
              label: 'Tasks Completed',
              data: formattedData.map((item: any) => item.count),
              fill: true,
              backgroundColor: 'rgba(75,192,192,0.2)',
              borderColor: 'rgba(75,192,192,1)',
              tension: 0.4,
              pointBackgroundColor: 'rgba(75,192,192,1)',
              pointBorderColor: '#fff',
              pointRadius: 4,
            },
          ],
        });
      } catch (err) {
        console.error('Error fetching productivity data:', err);
        setError('Failed to load task completion data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [period]);

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(0,0,0,0.8)',
        padding: 10,
        bodyFont: {
          size: 14,
        },
        titleFont: {
          size: 16,
          weight: 'bold',
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Tasks Completed',
          font: {
            size: 14,
            weight: 'bold',
          },
        },
        ticks: {
          precision: 0,
        },
      },
      x: {
        title: {
          display: true,
          text: 'Date',
          font: {
            size: 14,
            weight: 'bold',
          },
        },
        grid: {
          display: false,
        },
      },
    },
  };

  return (
    <Card sx={{ height: '100%', boxShadow: 3 }}>
      <CardHeader 
        title="Task Completion Trend" 
        titleTypographyProps={{ variant: 'h6' }}
        sx={{ 
          backgroundColor: 'primary.light', 
          color: 'primary.contrastText',
          pb: 1 
        }}
      />
      <CardContent sx={{ height: 300, position: 'relative' }}>
        {isLoading ? (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            height: '100%'
          }}>
            <CircularProgress />
          </div>
        ) : error ? (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            height: '100%',
            flexDirection: 'column'
          }}>
            <Typography color="error" variant="body1">
              {error}
            </Typography>
          </div>
        ) : (
          <Line data={chartData} options={options} />
        )}
      </CardContent>
    </Card>
  );
};

export default CompletionRateChart; 