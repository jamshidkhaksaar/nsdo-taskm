import React, { useState, useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import { format } from 'date-fns';
import axios from '../../utils/axios';

interface HeaderWidgetProps {
  username: string;
}

const HeaderWidget: React.FC<HeaderWidgetProps> = ({ username }) => {
  const [time, setTime] = useState(new Date());
  const [weatherInfo, setWeatherInfo] = useState({
    location: "Loading...",
    temp: "--°C",
    condition: "Loading",
    icon: "",
  });

  // Fetch weather data using WeatherAPI.com
  useEffect(() => {
    const fetchWeather = async () => {
      try {
        // Use the configured axios instance
        const settingsResponse = await axios.get('/api/settings/api-settings/1/');
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
        });
      } catch (error) {
        console.error("Error fetching weather:", error);
        setWeatherInfo({
          location: "Weather Unavailable",
          temp: "--°C",
          condition: "Error",
          icon: "",
        });
      }
    };

    fetchWeather();
    const weatherInterval = setInterval(fetchWeather, 300000); // Update every 5 minutes

    return () => clearInterval(weatherInterval);
  }, []);

  // Clock update effect
  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Function to get greeting based on time of day
  const getGreeting = () => {
    const hour = time.getHours();
    if (hour < 12) {
      return 'Good morning';
    } else if (hour < 17) {
      return 'Good afternoon';
    } else if (hour < 21) {
      return 'Good evening';
    } else {
      return 'Good night';
    }
  };

  return (
    <Box
      sx={{
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(8px)',
        boxShadow: '0 4px 16px 0 rgba(31, 38, 135, 0.37)',
        border: '1px solid rgba(255, 255, 255, 0.18)',
        borderRadius: '12px',
        padding: '12px',
        marginBottom: 3,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      {/* Greeting Section */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Box>
          <Typography
            variant="body1"
            sx={{
              color: '#fff',
              fontWeight: 500,
            }}
          >
            {getGreeting()},
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: 'rgba(255, 255, 255, 0.7)',
              fontWeight: 400,
            }}
          >
            {username}
          </Typography>
        </Box>
      </Box>

      {/* Right Section Container */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
        {/* Weather Widget */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            background: 'rgba(255, 255, 255, 0.05)',
            padding: '8px 16px',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <LocationOnIcon sx={{ color: 'rgba(255, 255, 255, 0.7)' }} />
            <Typography
              variant="body2"
              sx={{ color: '#fff' }}
            >
              {weatherInfo.location}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {weatherInfo.icon ? (
              <img 
                src={`https:${weatherInfo.icon}`} 
                alt={weatherInfo.condition}
                style={{ width: 24, height: 24 }}
              />
            ) : (
              <WbSunnyIcon sx={{ color: '#FFD700' }} />
            )}
            <Box>
              <Typography
                variant="body2"
                sx={{ color: '#fff', fontWeight: 500 }}
              >
                {weatherInfo.temp}
              </Typography>
              <Typography
                variant="caption"
                sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
              >
                {weatherInfo.condition}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Clock with improved design */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            background: 'rgba(255, 255, 255, 0.05)',
            padding: '8px 16px',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            position: 'relative',
          }}
        >
          <AccessTimeIcon 
            sx={{ 
              color: 'rgba(255, 255, 255, 0.7)',
              animation: 'pulse 2s infinite',
              '@keyframes pulse': {
                '0%': { opacity: 0.6 },
                '50%': { opacity: 1 },
                '100%': { opacity: 0.6 },
              }
            }} 
          />
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Typography
              variant="h6"
              sx={{ 
                color: '#fff',
                fontWeight: 600,
                letterSpacing: '2px',
                fontFamily: 'monospace',
                fontSize: '1.1rem',
              }}
            >
              {format(time, 'HH:mm')}
            </Typography>
            <Typography
              variant="caption"
              sx={{ 
                color: 'rgba(255, 255, 255, 0.7)',
                fontFamily: 'monospace',
              }}
            >
              {format(time, 'ss')} SEC
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default HeaderWidget; 