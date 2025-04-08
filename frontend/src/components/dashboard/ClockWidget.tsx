import React, { useState, useEffect } from 'react';
import { Box, Typography, Stack } from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { format } from 'date-fns';

const ClockWidget: React.FC = () => {
  const [time, setTime] = useState(new Date());
  const [timeZone, setTimeZone] = useState<string>('');

  useEffect(() => {
    // Update time every second
    const timerId = setInterval(() => {
      setTime(new Date());
    }, 1000);

    // Determine the user's timezone
    try {
      const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      setTimeZone(userTimeZone.replace('_', ' ')); // Replace underscores for better readability
    } catch (error) {
      console.error("Error detecting timezone:", error);
      setTimeZone("Timezone N/A");
    }

    // Clear interval on component unmount
    return () => clearInterval(timerId);
  }, []);

  return (
    <Box 
      sx={{ 
        width: '100%', 
        mb: { xs: 1.5, sm: 1 },
        backgroundColor: 'rgba(30, 41, 59, 0.8)',
        borderRadius: '8px',
        overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        border: 'none',
        p: { xs: 1.5, sm: 2 },
        display: 'flex',
        flexDirection: 'column', // Stack items vertically
        alignItems: 'center', // Center content horizontally
      }}
    >
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
        <AccessTimeIcon sx={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: { xs: 18, sm: 20 } }} />
        <Typography 
          variant="subtitle1" 
          sx={{ 
            color: '#fff', 
            fontWeight: 600,
            fontSize: { xs: '0.9rem', sm: '1rem' },
            letterSpacing: '0.01em' 
          }}
        >
          Current Time
        </Typography>
      </Stack>

      <Typography 
        variant="h5"
        sx={{ 
          color: '#fff', 
          fontWeight: 700, 
          mb: 0.5,
          fontSize: { xs: '1.75rem', sm: '2rem' },
          letterSpacing: '1px',
          fontFamily: "'Orbitron', sans-serif", // A digital-looking font (add to project if needed)
        }}
      >
        {format(time, 'HH:mm:ss')}
      </Typography>

      <Typography 
        variant="caption" 
        sx={{ 
          color: 'rgba(255, 255, 255, 0.7)',
          fontSize: { xs: '0.7rem', sm: '0.75rem' },
          letterSpacing: '0.5px'
        }}
      >
        {timeZone}
      </Typography>
    </Box>
  );
};

export default ClockWidget; 