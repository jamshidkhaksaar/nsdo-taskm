import React, { useState, useEffect } from 'react';
import { Box, Typography, CircularProgress, Button, Stack, Divider } from '@mui/material';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import CloudIcon from '@mui/icons-material/Cloud';
import AcUnitIcon from '@mui/icons-material/AcUnit';
import ThunderstormIcon from '@mui/icons-material/Thunderstorm';
import BeachAccessIcon from '@mui/icons-material/BeachAccess';
import RefreshIcon from '@mui/icons-material/Refresh';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import axios from 'axios';
import { SettingsService } from '../../services/settings';

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
      // Get API settings to retrieve the weather API key using SettingsService
      const apiSettings = await SettingsService.getApiSettings();
      const weatherApiKey = apiSettings.weather_api_key;
      const weatherApiEnabled = apiSettings.weather_api_enabled;
      
      if (!weatherApiEnabled || !weatherApiKey) {
        throw new Error('Weather API is not configured or disabled');
      }
      
      // Get user's location - this is a browser feature and requires permission
      if (!navigator.geolocation) {
        // Fallback to IP-based location if geolocation is not supported
        await fetchWeatherWithIP(weatherApiKey);
        return;
      }
      
      // Use geolocation to get precise coordinates
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          
          // Fetch from WeatherAPI.com with coordinates
          const response = await fetch(
            `https://api.weatherapi.com/v1/current.json?key=${weatherApiKey}&q=${latitude},${longitude}&aqi=no`
          );
          
          if (!response.ok) {
            throw new Error('Weather service unavailable');
          }
          
          const data = await response.json();
          
          console.log('Weather API response:', data);
          
          setWeather({
            location: `${data.location.name}, ${data.location.country}`,
            temperature: data.current.temp_c,
            condition: data.current.condition.text,
            humidity: data.current.humidity,
            wind: data.current.wind_kph,
            icon: data.current.condition.code ? data.current.condition.code.toString() : data.current.condition.icon
          });
          
          setLoading(false);
        },
        async (err) => {
          // Fallback to IP-based location if permission denied
          console.log('Location permission denied, falling back to IP-based location');
          await fetchWeatherWithIP(weatherApiKey);
        }
      );
    } catch (err) {
      console.error('Weather error:', err);
      setError('Unable to fetch weather data. Please try again later.');
      setLoading(false);
    }
  };
  
  // Fallback method using IP for location
  const fetchWeatherWithIP = async (apiKey: string) => {
    try {
      // Get location from IP
      const locationResponse = await fetch('https://ipapi.co/json/');
      const locationData = await locationResponse.json();
      
      // Fetch weather data from WeatherAPI.com
      const weatherResponse = await fetch(
        `https://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${locationData.city}&aqi=no`
      );
      
      if (!weatherResponse.ok) {
        throw new Error('Weather API request failed');
      }
      
      const data = await weatherResponse.json();
      
      console.log('Weather API response (IP-based):', data);
      
      setWeather({
        location: `${data.location.name}, ${data.location.country}`,
        temperature: data.current.temp_c,
        condition: data.current.condition.text,
        humidity: data.current.humidity,
        wind: data.current.wind_kph,
        icon: data.current.condition.code ? data.current.condition.code.toString() : data.current.condition.icon
      });
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching weather with IP:', error);
      setError('Unable to determine your location.');
      setLoading(false);
    }
  };
  
  // Fetch weather data on component mount
  useEffect(() => {
    fetchWeatherData();
    // Periodically update weather data every 15 minutes
    const interval = setInterval(fetchWeatherData, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);
  
  // Function to get appropriate weather icon based on condition code
  const getWeatherIcon = () => {
    if (!weather) return <CloudIcon fontSize="large" sx={{ color: '#3498db' }} />;
    
    // Check if icon is a URL (from the API's icon field)
    if (typeof weather.icon === 'string' && weather.icon.includes('//')) {
      return (
        <Box sx={{ width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <img 
            src={`https:${weather.icon}`} 
            alt={weather.condition}
            style={{ width: 24, height: 24 }}
          />
        </Box>
      );
    }
    
    // Otherwise, map condition codes to our icon set
    try {
      // Try to parse as a number if it's a condition code
      const conditionCode = parseInt(weather.icon);
      
      // Sunny conditions (1000 = clear, 1003 = partly cloudy)
      if (conditionCode === 1000) {
        return <WbSunnyIcon fontSize="large" sx={{ color: '#f39c12' }} />;
      }
      // Snow conditions (1066, 1114, 1117, 1210 etc.)
      else if ([1066, 1114, 1117, 1210, 1213, 1216, 1219, 1222, 1225, 1255, 1258].includes(conditionCode)) {
        return <AcUnitIcon fontSize="large" sx={{ color: '#ecf0f1' }} />;
      }
      // Rain conditions (1063, 1180, 1183 etc.)
      else if ([1063, 1150, 1153, 1180, 1183, 1186, 1189, 1192, 1195, 1240, 1243, 1246].includes(conditionCode)) {
        return <BeachAccessIcon fontSize="large" sx={{ color: '#3498db' }} />;
      }
      // Storm conditions (1087, 1273, 1276 etc.)
      else if ([1087, 1273, 1276, 1279, 1282].includes(conditionCode)) {
        return <ThunderstormIcon fontSize="large" sx={{ color: '#9b59b6' }} />;
      }
    } catch (e) {
      // If parsing as a number fails, just use default icon
      console.warn('Could not parse condition code:', weather.icon);
    }
    
    // Default to cloudy for all other conditions
    return <CloudIcon fontSize="large" sx={{ color: '#bdc3c7' }} />;
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