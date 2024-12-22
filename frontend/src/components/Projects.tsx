import React from 'react';
import { 
  Box, 
  Typography,
  IconButton,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';

const Projects: React.FC = () => {
  return (
    <Box
      sx={{
        p: 3,
        borderRadius: 3,
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        transition: 'all 0.3s ease',
        height: '100%',
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
          Projects
        </Typography>
        <IconButton 
          size="small"
          sx={{ 
            bgcolor: 'primary.main',
            color: 'white',
            '&:hover': {
              bgcolor: 'primary.dark',
            },
          }}
        >
          <AddIcon />
        </IconButton>
      </Box>

      {/* Content */}
      <Box sx={{ minHeight: 200 }}>
        <Typography variant="body2" color="text.secondary" align="center">
          No projects yet
        </Typography>
      </Box>
    </Box>
  );
};

export default Projects; 