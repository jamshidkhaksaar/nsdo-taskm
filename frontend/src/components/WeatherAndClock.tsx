import React from 'react';
import { Box, Typography, Divider } from '@mui/material';
import { format } from 'date-fns';
import WeatherWidget from './WeatherWidget';

interface WeatherAndClockProps {
  currentTime: Date;
}

const WeatherAndClock: React.FC<WeatherAndClockProps> = ({ currentTime }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        background: 'rgba(255,255,255,0.03)',
        borderRadius: 1.5,
        overflow: 'hidden',
        border: '1px solid',
        borderColor: 'divider',
        height: '40px',
        px: 1.5,
      }}
    >
      <WeatherWidget />
      <Divider 
        orientation="vertical" 
        flexItem 
        sx={{ 
          borderColor: 'rgba(255, 255, 255, 0.1)',
          mx: 1,
          height: '20px',
          my: 'auto',
        }} 
      />
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
        }}
      >
        <Typography
          variant="body1"
          sx={{
            fontWeight: 600,
            fontFamily: 'monospace',
            color: 'primary.main',
            fontSize: '1rem',
          }}
        >
          {format(currentTime, 'HH:mm')}
        </Typography>
        <Typography
          variant="caption"
          sx={{
            color: 'text.secondary',
            fontSize: '0.7rem',
          }}
        >
          {format(currentTime, 'a')}
        </Typography>
      </Box>
    </Box>
  );
};

export default WeatherAndClock; 