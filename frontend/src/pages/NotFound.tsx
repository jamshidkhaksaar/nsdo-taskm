import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const NotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #1e2a78 0%, #ff3c7d 100%)',
      }}
    >
      <Typography
        variant="h1"
        sx={{
          color: '#fff',
          marginBottom: 2,
          fontSize: { xs: '4rem', md: '6rem' },
          textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
        }}
      >
        404
      </Typography>
      <Typography
        variant="h4"
        sx={{
          color: '#fff',
          marginBottom: 4,
          textAlign: 'center',
          textShadow: '1px 1px 2px rgba(0,0,0,0.3)',
        }}
      >
        Page Not Found
      </Typography>
      <Button
        variant="contained"
        onClick={() => navigate('/dashboard')}
        sx={{
          backgroundColor: 'rgba(255, 255, 255, 0.2)',
          backdropFilter: 'blur(10px)',
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.3)',
          },
        }}
      >
        Back to Dashboard
      </Button>
    </Box>
  );
};

export default NotFound; 