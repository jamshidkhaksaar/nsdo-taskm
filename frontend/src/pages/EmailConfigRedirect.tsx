import React, { useEffect } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const EmailConfigRedirect: React.FC = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    console.log('EmailConfigRedirect component loaded');
    // Short timeout to ensure we don't redirect too quickly
    const timer = setTimeout(() => {
      console.log('Redirecting to Email Configuration component directly');
      navigate('/admin/email-configuration/view', { replace: true });
    }, 500);
    
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <Box 
      sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100vh' 
      }}
    >
      <CircularProgress size={60} />
      <Typography variant="h6" sx={{ mt: 2 }}>
        Loading Email Configuration...
      </Typography>
    </Box>
  );
};

export default EmailConfigRedirect; 