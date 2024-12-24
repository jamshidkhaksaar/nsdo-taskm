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
        position: 'fixed',
        bottom: 0,
        right: 0,
        left: { 
          xs: 0, 
          sm: open ? `${drawerWidth + 250}px` : `${72 + 250}px`,
        },
        height: '28px', // Even more compact
        padding: '0.15rem',
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(8px)',
        borderTop: '1px solid rgba(255, 255, 255, 0.18)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 0.5,
        zIndex: 10,
      }}
    >
      <Typography
        variant="caption"
        sx={{
          color: 'rgba(255, 255, 255, 0.9)',
          fontWeight: 500,
          fontSize: '0.65rem',
        }}
      >
        Developed by Jamshid Khaksaar
      </Typography>
      <Box sx={{ display: 'flex', gap: 0.25 }}>
        <IconButton
          component="a"
          href="https://github.com/JamshidKhaksaar"
          target="_blank"
          rel="noopener noreferrer"
          size="small"
          sx={{
            color: 'rgba(255, 255, 255, 0.9)',
            padding: '1px',
            '&:hover': {
              background: 'rgba(255, 255, 255, 0.1)',
              transform: 'translateY(-1px)',
            },
            transition: 'transform 0.2s ease-in-out',
          }}
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
            padding: '1px',
            '&:hover': {
              background: 'rgba(255, 255, 255, 0.1)',
              transform: 'translateY(-1px)',
            },
            transition: 'transform 0.2s ease-in-out',
          }}
        >
          <LinkedInIcon sx={{ fontSize: '0.9rem' }} />
        </IconButton>
      </Box>
    </Box>
  );
};

export default Footer; 