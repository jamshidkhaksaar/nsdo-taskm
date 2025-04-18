import React, { useState, useEffect, useCallback } from 'react';
import { Box, Typography, CircularProgress, Button, Stack, Divider } from '@mui/material';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import CloudIcon from '@mui/icons-material/Cloud';
import AcUnitIcon from '@mui/icons-material/AcUnit';
import ThunderstormIcon from '@mui/icons-material/Thunderstorm';
import BeachAccessIcon from '@mui/icons-material/BeachAccess';
import RefreshIcon from '@mui/icons-material/Refresh';
import LocationOnIcon from '@mui/icons-material/LocationOn';
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

  const fetchWeatherData = useCallback(async () => {
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
  }, []);
  
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
  }, [fetchWeatherData]);
  
  // Function to get appropriate weather icon based on condition code
  const getWeatherIcon = () => {
    if (!weather) return <CloudIcon sx={{ color: '#3498db', fontSize: { xs: 28, sm: 32 } }} />;
    
    // Check if icon is a URL (from the API's icon field)
    if (typeof weather.icon === 'string' && weather.icon.includes('//')) {
      return (
        <Box sx={{ 
          width: { xs: 28, sm: 32 }, 
          height: { xs: 28, sm: 32 }, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center' 
        }}>
          <img 
            src={`https:${weather.icon}`} 
            alt={weather.condition}
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
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
        return <WbSunnyIcon sx={{ color: '#f39c12', fontSize: { xs: 28, sm: 32 } }} />;
      }
      // Snow conditions (1066, 1114, 1117, 1210 etc.)
      else if ([1066, 1114, 1117, 1210, 1213, 1216, 1219, 1222, 1225, 1255, 1258].includes(conditionCode)) {
        return <AcUnitIcon sx={{ color: '#ecf0f1', fontSize: { xs: 28, sm: 32 } }} />;
      }
      // Rain conditions (1063, 1180, 1183 etc.)
      else if ([1063, 1150, 1153, 1180, 1183, 1186, 1189, 1192, 1195, 1240, 1243, 1246].includes(conditionCode)) {
        return <BeachAccessIcon sx={{ color: '#3498db', fontSize: { xs: 28, sm: 32 } }} />;
      }
      // Storm conditions (1087, 1273, 1276 etc.)
      else if ([1087, 1273, 1276, 1279, 1282].includes(conditionCode)) {
        return <ThunderstormIcon sx={{ color: '#9b59b6', fontSize: { xs: 28, sm: 32 } }} />;
      }
    } catch (e) {
      // If parsing as a number fails, just use default icon
      console.warn('Could not parse condition code:', weather.icon);
    }
    
    // Default to cloudy for all other conditions
    return <CloudIcon sx={{ color: '#bdc3c7', fontSize: { xs: 28, sm: 32 } }} />;
  };
  
  return (
    <Box 
      sx={{ 
        width: '100%', 
        mb: { xs: 1.5, sm: 1 },
        backgroundColor: 'rgba(30, 41, 59, 0.8)',
        borderRadius: '8px',
        overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        border: 'none'
      }}
    >
      {compact ? (
        // Compact view for smaller spaces
        <Box sx={{ 
          p: { xs: 1.25, sm: 1.5 }, 
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Stack direction="row" spacing={1.25} alignItems="center">
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {getWeatherIcon()}
            </Box>
            <Typography 
              variant="subtitle2" 
              sx={{ 
                fontWeight: 600, 
                color: '#fff',
                fontSize: { xs: '0.9rem', sm: '1rem' },
                letterSpacing: '0.01em'
              }}
            >
              {weather?.temperature}°C
            </Typography>
          </Stack>
          
          {weather && (
            <Typography 
              variant="body2" 
              sx={{ 
                color: 'rgba(255, 255, 255, 0.85)',
                fontWeight: 500,
                fontSize: { xs: '0.75rem', sm: '0.8rem' },
                letterSpacing: '0.01em',
                ml: 1
              }}
            >
              {weather.location.split(',')[0]}
            </Typography>
          )}
        </Box>
      ) : (
      <Box sx={{ 
        p: { xs: 1.5, sm: 2 },
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexDirection: { xs: 'column', sm: 'row' },
        gap: { xs: 1.5, sm: 0 }
      }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <Typography 
            variant="subtitle1" 
            sx={{ 
              color: '#fff', 
              fontWeight: 600,
              letterSpacing: '0.01em',
              fontSize: { xs: '0.9rem', sm: '1rem' }
            }}
          >
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
            aria-label="Refresh weather data"
          >
            <RefreshIcon fontSize="small" />
          </Button>
        </Stack>
          
        {loading ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CircularProgress size={16} sx={{ color: 'rgba(255, 255, 255, 0.8)' }} />
            <Typography 
              variant="body2" 
              sx={{ 
                color: 'rgba(255, 255, 255, 0.8)', 
                fontWeight: 500,
                fontSize: { xs: '0.75rem', sm: '0.8rem' }
              }}
            >
              Retrieving weather data...
            </Typography>
          </Box>
        ) : error ? (
          <Typography 
            variant="body2" 
            sx={{ 
              color: 'rgba(255, 255, 255, 0.8)', 
              fontWeight: 500,
              fontSize: { xs: '0.75rem', sm: '0.8rem' }
            }}
          >
            {error}
          </Typography>
        ) : weather ? (
          <Stack 
            direction={{ xs: 'column', sm: 'row' }} 
            spacing={{ xs: 1.5, sm: 2 }} 
            alignItems="center" 
            divider={<Divider orientation="vertical" flexItem sx={{ bgcolor: 'rgba(255,255,255,0.15)', display: { xs: 'none', sm: 'block' } }} />}
            sx={{ width: { xs: '100%', sm: 'auto' } }}
          >
            <Stack direction="row" spacing={0.75} alignItems="center">
              <LocationOnIcon sx={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: { xs: 16, sm: 18 } }} />
              <Typography 
                variant="body2" 
                sx={{ 
                  color: 'rgba(255, 255, 255, 0.9)', 
                  fontWeight: 500,
                  fontSize: { xs: '0.75rem', sm: '0.85rem' },
                  letterSpacing: '0.01em'
                }}
              >
                {weather.location}
              </Typography>
            </Stack>
            
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ ml: { xs: 0, sm: 1 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {getWeatherIcon()}
              </Box>
              <Stack direction="row" spacing={1} alignItems="baseline">
                <Typography 
                  variant="h6" 
                  sx={{ 
                    fontWeight: 600, 
                    color: '#fff',
                    fontSize: { xs: '1rem', sm: '1.1rem' },
                    letterSpacing: '0.02em'
                  }}
                >
                  {weather.temperature}°C
                </Typography>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: 'rgba(255, 255, 255, 0.85)',
                    fontWeight: 500,
                    fontSize: { xs: '0.75rem', sm: '0.85rem' },
                    whiteSpace: 'nowrap'
                  }}
                >
                  {weather.condition}
                </Typography>
              </Stack>
            </Stack>
          </Stack>
        ) : (
          <Typography 
            variant="body2" 
            sx={{ 
              color: 'rgba(255, 255, 255, 0.8)', 
              fontWeight: 500,
              fontSize: { xs: '0.75rem', sm: '0.8rem' }
            }}
          >
            Weather information unavailable
          </Typography>
        )}
      </Box>
      )}    
    </Box>
  );
};

export default WeatherWidget;