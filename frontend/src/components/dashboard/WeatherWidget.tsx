import React, { useState, useEffect } from 'react';
import { Box, Typography, CircularProgress, Button, Stack, Divider } from '@mui/material';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import CloudIcon from '@mui/icons-material/Cloud';
import AcUnitIcon from '@mui/icons-material/AcUnit';
import ThunderstormIcon from '@mui/icons-material/Thunderstorm';
import BeachAccessIcon from '@mui/icons-material/BeachAccess';
import RefreshIcon from '@mui/icons-material/Refresh';
import LocationOnIcon from '@mui/icons-material/LocationOn';

interface WeatherWidgetProps {
  compact?: boolean;
}

// Types for weather data
interface WeatherData {
  location: string;
  temperature: number;
  condition: string;
  humidity: number;
  wind: number;
  icon: string;
}

const WeatherWidget: React.FC<WeatherWidgetProps> = ({ compact = false }) => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWeatherData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Get user's location - this is a browser feature and requires permission
      if (!navigator.geolocation) {
        throw new Error('Geolocation is not supported by your browser');
      }
      
      // Use a free weather API service (replace with your preferred service)
      // For demonstration - let's create some mock data since we can't guarantee API access
      // In a real app, you would use your API key and fetch from a weather service
      
      // Mock data for demonstration
      setTimeout(() => {
        const mockWeather: WeatherData = {
          location: 'San Francisco, CA',
          temperature: 18,
          condition: 'Partly Cloudy',
          humidity: 65,
          wind: 12,
          icon: 'cloud'
        };
        
        setWeather(mockWeather);
        setLoading(false);
      }, 1000);
      
      // Real implementation would look like this:
      /*
      navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords;
        
        // Replace with your actual weather API endpoint and key
        const response = await fetch(
          `https://api.weatherapi.com/v1/current.json?key=YOUR_API_KEY&q=${latitude},${longitude}`
        );
        
        if (!response.ok) {
          throw new Error('Weather service unavailable');
        }
        
        const data = await response.json();
        
        setWeather({
          location: `${data.location.name}, ${data.location.country}`,
          temperature: data.current.temp_c,
          condition: data.current.condition.text,
          humidity: data.current.humidity,
          wind: data.current.wind_kph,
          icon: data.current.condition.icon
        });
        
        setLoading(false);
      }, (err) => {
        setError('Location access denied. Please enable location services.');
        setLoading(false);
      });
      */
      
    } catch (err) {
      setError('Unable to fetch weather data. Please try again later.');
      setLoading(false);
    }
  };
  
  // Fetch weather data on component mount
  useEffect(() => {
    fetchWeatherData();
  }, []);
  
  // Function to get appropriate weather icon
  const getWeatherIcon = () => {
    if (!weather) return <CloudIcon fontSize="large" sx={{ color: '#3498db' }} />;
    
    switch(weather.icon) {
      case 'sun':
        return <WbSunnyIcon fontSize="large" sx={{ color: '#f39c12' }} />;
      case 'snow':
        return <AcUnitIcon fontSize="large" sx={{ color: '#ecf0f1' }} />;
      case 'rain':
        return <BeachAccessIcon fontSize="large" sx={{ color: '#3498db' }} />;
      case 'storm':
        return <ThunderstormIcon fontSize="large" sx={{ color: '#9b59b6' }} />;
      case 'cloud':
      default:
        return <CloudIcon fontSize="large" sx={{ color: '#bdc3c7' }} />;
    }
  };
  
  return (
    <Box 
      sx={{ 
        width: '100%', 
        mb: 1,
        backgroundColor: 'rgba(30, 41, 59, 0.8)',
        borderRadius: '8px',
        overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        border: '1px solid rgba(255, 255, 255, 0.08)'
      }}
    >
      <Box sx={{ 
        p: 1.5,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <Typography variant="subtitle2" sx={{ color: '#fff', fontWeight: 500 }}>
            Weather
          </Typography>
          <Button 
            size="small" 
            onClick={fetchWeatherData}
            sx={{ 
              minWidth: 'auto', 
              p: 0.5,
              ml: -0.5,
              color: 'rgba(255, 255, 255, 0.7)',
              '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.1)' }
            }}
          >
            <RefreshIcon fontSize="small" />
          </Button>
        </Stack>
          
        {loading ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CircularProgress size={16} sx={{ color: 'rgba(255, 255, 255, 0.7)' }} />
            <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
              Loading...
            </Typography>
          </Box>
        ) : error ? (
          <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
            {error}
          </Typography>
        ) : weather ? (
          <Stack direction="row" spacing={2} alignItems="center" divider={<Divider orientation="vertical" flexItem sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} />}>
            <Stack direction="row" spacing={0.5} alignItems="center">
              <LocationOnIcon sx={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: 14 }} />
              <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                {weather.location}
              </Typography>
            </Stack>
            
            <Stack direction="row" spacing={1} alignItems="center">
              {getWeatherIcon()}
              <Stack direction="row" spacing={0.5} alignItems="baseline">
                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#fff' }}>
                  {weather.temperature}°C
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                  {weather.condition}
                </Typography>
              </Stack>
            </Stack>
          </Stack>
        ) : (
          <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
            Weather data unavailable
          </Typography>
        )}
      </Box>
    </Box>
  );
};

export default WeatherWidget; 