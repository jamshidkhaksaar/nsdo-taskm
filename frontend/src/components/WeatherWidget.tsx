import React, { useState, useEffect, useCallback } from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import CloudIcon from '@mui/icons-material/Cloud';
import ThunderstormIcon from '@mui/icons-material/Thunderstorm';
import GrainIcon from '@mui/icons-material/Grain';
import AcUnitIcon from '@mui/icons-material/AcUnit';
import { useWeather } from '../context/WeatherContext';

interface LocationData {
  latitude: number;
  longitude: number;
}

const WeatherWidget: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { weather, setWeather } = useWeather();

  // Convert WMO weather codes to descriptions and icons
  const getWeatherInfo = useCallback((code: number) => {
    // WMO Weather interpretation codes (WW)
    // https://open-meteo.com/en/docs
    if (code === 0) return { description: 'Clear sky', icon: <WbSunnyIcon sx={{ color: '#FFD700', fontSize: 32 }} /> };
    if (code === 1) return { description: 'Mainly clear', icon: <WbSunnyIcon sx={{ color: '#FFD700', fontSize: 32 }} /> };
    if (code === 2) return { description: 'Partly cloudy', icon: <CloudIcon sx={{ color: '#A9A9A9', fontSize: 32 }} /> };
    if (code === 3) return { description: 'Overcast', icon: <CloudIcon sx={{ color: '#A9A9A9', fontSize: 32 }} /> };
    if (code >= 51 && code <= 67) return { description: 'Drizzle', icon: <GrainIcon sx={{ color: '#4682B4', fontSize: 32 }} /> };
    if (code >= 71 && code <= 77) return { description: 'Snow', icon: <AcUnitIcon sx={{ color: '#F0F8FF', fontSize: 32 }} /> };
    if (code >= 80 && code <= 82) return { description: 'Rain showers', icon: <GrainIcon sx={{ color: '#4682B4', fontSize: 32 }} /> };
    if (code >= 95 && code <= 99) return { description: 'Thunderstorm', icon: <ThunderstormIcon sx={{ color: '#4169E1', fontSize: 32 }} /> };
    return { description: 'Clear', icon: <WbSunnyIcon sx={{ color: '#FFD700', fontSize: 32 }} /> };
  }, []);

  const getLocationByIP = async (): Promise<LocationData> => {
    try {
      // Try ipapi.co first
      const response = await fetch('https://ipapi.co/json/');
      if (response.ok) {
        const data = await response.json();
        return {
          latitude: data.latitude,
          longitude: data.longitude
        };
      }

      // If ipapi.co fails, try ip-api.com as fallback
      const fallbackResponse = await fetch('http://ip-api.com/json/');
      if (fallbackResponse.ok) {
        const data = await fallbackResponse.json();
        return {
          latitude: data.lat,
          longitude: data.lon
        };
      }

      throw new Error('Location services unavailable');
    } catch (err) {
      console.log('IP geolocation failed, using default location');
      // Default to London
      return {
        latitude: 51.5074,
        longitude: -0.1278
      };
    }
  };

  const fetchWeather = useCallback(async (latitude: number, longitude: number) => {
    try {
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&timezone=auto`
      );
      
      if (!response.ok) {
        throw new Error('Weather data not available');
      }

      const data = await response.json();
      const weatherInfo = getWeatherInfo(data.current.weather_code);
      
      setWeather({
        temp: Math.round(data.current.temperature_2m),
        description: weatherInfo.description,
        weatherCode: data.current.weather_code,
        humidity: Math.round(data.current.relative_humidity_2m),
        windSpeed: Math.round(data.current.wind_speed_10m),
      });
      setLoading(false);
    } catch (err) {
      setError('Unable to fetch weather data');
      setLoading(false);
    }
  }, [getWeatherInfo, setWeather]);

  useEffect(() => {
    const getWeatherData = async () => {
      try {
        let location: LocationData;
        
        if (navigator.geolocation) {
          try {
            location = await new Promise((resolve, reject) => {
              navigator.geolocation.getCurrentPosition(
                (position) => {
                  resolve({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude
                  });
                },
                (error) => {
                  console.log('Browser geolocation failed:', error.message);
                  reject(error);
                },
                {
                  timeout: 5000,
                  enableHighAccuracy: false,
                  maximumAge: 300000 // 5 minutes cache
                }
              );
            });
          } catch (error) {
            console.log('Falling back to IP geolocation');
            location = await getLocationByIP();
          }
        } else {
          console.log('Geolocation not supported, using IP geolocation');
          location = await getLocationByIP();
        }

        await fetchWeather(location.latitude, location.longitude);
      } catch (err) {
        setError('Unable to fetch weather data');
        setLoading(false);
      }
    };

    getWeatherData();
  }, [fetchWeather]);

  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        p: 2,
        background: 'rgba(255,255,255,0.03)',
        borderRadius: 2,
        minWidth: '140px',
      }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  if (error || !weather) {
    return (
      <Box sx={{ 
        p: 2,
        background: 'rgba(255,255,255,0.03)',
        borderRadius: 2,
        minWidth: '140px',
      }}>
        <Typography variant="body2" color="text.secondary" align="center">
          {error || 'Weather unavailable'}
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        height: '100%',
      }}
    >
      {weather && getWeatherInfo(weather.weatherCode).icon}
      <Typography 
        sx={{ 
          fontWeight: 600,
          fontSize: '0.9rem',
          color: 'primary.main',
        }}
      >
        {weather?.temp}°C
      </Typography>
    </Box>
  );
};

export default WeatherWidget; 