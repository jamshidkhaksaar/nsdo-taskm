import React, { useState, useEffect } from 'react';
import { Box, Typography, Skeleton, Tooltip, IconButton } from '@mui/material';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import RefreshIcon from '@mui/icons-material/Refresh';
import axios from '../../utils/axios';

interface WeatherWidgetProps {
  compact?: boolean;
  ultraCompact?: boolean; // New prop for an even more compact version
}

interface WeatherInfo {
  location: string;
  temp: string;
  condition: string;
  icon: string;
  isLoading: boolean;
  error: boolean;
}

const WeatherWidget: React.FC<WeatherWidgetProps> = ({ compact = false, ultraCompact = false }) => {
  const [weatherInfo, setWeatherInfo] = useState<WeatherInfo>({
    location: "Loading...",
    temp: "--°C",
    condition: "Loading",
    icon: "",
    isLoading: true,
    error: false
  });

  const fetchWeather = async () => {
    try {
      setWeatherInfo(prev => ({ ...prev, isLoading: true, error: false }));
      
      // Use the configured axios instance
      const settingsResponse = await axios.get('/api/api-settings/1/');
      const weatherApiKey = settingsResponse.data.weather_api_key;
      const weatherApiEnabled = settingsResponse.data.weather_api_enabled;
      
      if (!weatherApiEnabled || !weatherApiKey) {
        throw new Error('Weather API is not configured or disabled');
      }

      // Get location from IP
      const locationResponse = await fetch('https://ipapi.co/json/');
      const locationData = await locationResponse.json();
      
      // Fetch weather data from WeatherAPI.com
      const weatherResponse = await fetch(
        `https://api.weatherapi.com/v1/current.json?key=${weatherApiKey}&q=${locationData.city}&aqi=no`
      );
      
      if (!weatherResponse.ok) {
        throw new Error('Weather API request failed');
      }
      
      const weatherData = await weatherResponse.json();

      setWeatherInfo({
        location: `${weatherData.location.name}, ${weatherData.location.country}`,
        temp: `${weatherData.current.temp_c}°C`,
        condition: weatherData.current.condition.text,
        icon: weatherData.current.condition.icon,
        isLoading: false,
        error: false
      });
    } catch (error) {
      console.error("Error fetching weather:", error);
      setWeatherInfo({
        location: "Weather Unavailable",
        temp: "--°C",
        condition: "Error",
        icon: "",
        isLoading: false,
        error: true
      });
    }
  };

  useEffect(() => {
    fetchWeather();
    const weatherInterval = setInterval(fetchWeather, 300000); // Update every 5 minutes

    return () => clearInterval(weatherInterval);
  }, []);

  // Ultra compact version - just temperature
  if (ultraCompact) {
    return (
      <Tooltip title={weatherInfo.condition}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(8px)',
            borderRadius: '8px',
            padding: '4px 8px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            height: '28px',
          }}
        >
          {weatherInfo.isLoading ? (
            <Skeleton width={40} height={20} sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)' }} />
          ) : (
            <Typography variant="caption" sx={{ color: '#fff', fontWeight: 500 }}>
              {weatherInfo.temp}
            </Typography>
          )}
        </Box>
      </Tooltip>
    );
  }

  // Compact version - icon and temperature
  if (compact) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(8px)',
          borderRadius: '8px',
          padding: '4px 8px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          height: '32px',
        }}
      >
        {weatherInfo.isLoading ? (
          <Skeleton variant="circular" width={20} height={20} sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)' }} />
        ) : weatherInfo.icon ? (
          <img 
            src={`https:${weatherInfo.icon}`} 
            alt={weatherInfo.condition}
            style={{ width: 20, height: 20 }}
          />
        ) : (
          <WbSunnyIcon sx={{ color: '#FFD700', fontSize: 20 }} />
        )}
        
        {weatherInfo.isLoading ? (
          <Skeleton width={40} height={20} sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)' }} />
        ) : (
          <Typography variant="caption" sx={{ color: '#fff', fontWeight: 500 }}>
            {weatherInfo.temp}
          </Typography>
        )}
      </Box>
    );
  }

  // Full version but more compact
  return (
    <Box
      sx={{
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(8px)',
        borderRadius: '8px',
        padding: '10px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 4px 8px 0 rgba(31, 38, 135, 0.15)',
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="subtitle1" sx={{ color: '#fff', fontWeight: 600 }}>
          Weather
        </Typography>
        <Tooltip title="Refresh weather">
          <IconButton 
            size="small" 
            onClick={fetchWeather}
            sx={{ 
              color: 'rgba(255, 255, 255, 0.7)',
              padding: '4px',
              '&:hover': { color: '#fff', backgroundColor: 'rgba(255, 255, 255, 0.1)' }
            }}
          >
            <RefreshIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
      
      {weatherInfo.isLoading ? (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Skeleton variant="circular" width={40} height={40} sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)' }} />
          <Box>
            <Skeleton variant="text" width={60} height={20} sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)' }} />
            <Skeleton variant="text" width={100} height={16} sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)' }} />
          </Box>
        </Box>
      ) : weatherInfo.error ? (
        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
          Weather data unavailable
        </Typography>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 1.5 }}>
          {weatherInfo.icon ? (
            <img 
              src={`https:${weatherInfo.icon}`} 
              alt={weatherInfo.condition}
              style={{ width: 40, height: 40 }}
            />
          ) : (
            <WbSunnyIcon sx={{ color: '#FFD700', fontSize: 40 }} />
          )}
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
              <Typography variant="h6" sx={{ color: '#fff', fontWeight: 700, lineHeight: 1 }}>
                {weatherInfo.temp}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                {weatherInfo.condition}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <LocationOnIcon sx={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: 12 }} />
              <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                {weatherInfo.location}
              </Typography>
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default WeatherWidget; 