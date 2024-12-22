import React from 'react';
import { 
  Box, 
  Typography,
} from '@mui/material';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';

const AssignedByMeTasks: React.FC = () => {
  return (
    <Box
      sx={{
        p: 3,
        borderRadius: 3,
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        transition: 'all 0.3s ease',
        display: 'flex',
        flexDirection: 'column',
        '&:hover': {
          boxShadow: '0 4px 20px 0 rgba(0,0,0,0.1)',
          transform: 'translateY(-2px)',
        },
      }}
    >
      {/* Header */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        mb: 3 
      }}>
        <Typography 
          variant="h6" 
          sx={{ 
            fontWeight: 700,
            letterSpacing: '0.5px',
            fontSize: '1.2rem',
            background: 'linear-gradient(45deg, #2E7D32 30%, #4CAF50 90%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textShadow: '0 0 20px rgba(46, 125, 50, 0.1)',
          }}
        >
          Tasks I have assigned
        </Typography>
      </Box>

      {/* Content */}
      <Box 
        sx={{ 
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2,
          py: 3
        }}
      >
        <PersonOutlineIcon 
          sx={{ 
            fontSize: '48px',
            color: 'primary.light',
            opacity: 0.6
          }}
        />
        <Typography variant="body2" color="text.secondary" align="center">
          No tasks assigned to others
        </Typography>
      </Box>
    </Box>
  );
};

export default AssignedByMeTasks; 