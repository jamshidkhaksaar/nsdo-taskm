import React from 'react';
import { Box, Typography, IconButton } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

interface ErrorDisplayProps {
  error: string | null;
  onClear: () => void;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ error, onClear }) => {
  if (!error) return null;
  
  return (
    <Box sx={{ 
      p: 2, 
      bgcolor: 'rgba(255, 107, 107, 0.8)',
      color: '#fff',
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 9999,
      boxShadow: '0 4px 16px 0 rgba(31, 38, 135, 0.37)',
      borderRadius: '0 0 8px 8px',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    }}>
      <Typography>{error}</Typography>
      <IconButton 
        size="small" 
        onClick={onClear}
        sx={{ color: '#fff' }}
      >
        <DeleteIcon fontSize="small" />
      </IconButton>
    </Box>
  );
};

export default ErrorDisplay; 