import React from 'react';
import { Box, Typography, IconButton } from '@mui/material';
import GitHubIcon from '@mui/icons-material/GitHub';
import LinkedInIcon from '@mui/icons-material/LinkedIn';

interface FooterProps {
  open: boolean;
  drawerWidth: number;
}

const Footer: React.FC<FooterProps> = ({ open, drawerWidth }) => {
  return (
    <Box
      component="footer"
      sx={{
        width: '100%',
        height: '100%',
        background: 'transparent',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        px: 2,
      }}
    >
      <Typography
        variant="caption"
        sx={{
          color: 'rgba(255, 255, 255, 0.9)',
          fontWeight: 500,
          fontSize: '0.7rem',
          whiteSpace: 'nowrap',
        }}
      >
        Developed by Jamshid Khaksaar
      </Typography>
      
      <Box sx={{ display: 'flex', gap: 0.5 }}>
        <IconButton
          component="a"
          href="https://github.com/JamshidKhaksaar"
          target="_blank"
          rel="noopener noreferrer"
          size="small"
          sx={{
            color: 'rgba(255, 255, 255, 0.9)',
            padding: '2px',
            '&:hover': {
              background: 'rgba(255, 255, 255, 0.1)',
              transform: 'translateY(-1px)',
              color: '#fff',
            },
            transition: 'all 0.2s ease-in-out',
          }}
          aria-label="GitHub"
        >
          <GitHubIcon sx={{ fontSize: '0.9rem' }} />
        </IconButton>
        <IconButton
          component="a"
          href="https://linkedin.com/in/jamshid-khaksaar"
          target="_blank"
          rel="noopener noreferrer"
          size="small"
          sx={{
            color: 'rgba(255, 255, 255, 0.9)',
            padding: '2px',
            '&:hover': {
              background: 'rgba(255, 255, 255, 0.1)',
              transform: 'translateY(-1px)',
              color: '#fff',
            },
            transition: 'all 0.2s ease-in-out',
          }}
          aria-label="LinkedIn"
        >
          <LinkedInIcon sx={{ fontSize: '0.9rem' }} />
        </IconButton>
      </Box>
    </Box>
  );
};

export default Footer; 