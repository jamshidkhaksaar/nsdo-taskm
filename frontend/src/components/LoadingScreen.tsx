import React from 'react';
import { Box, Typography, keyframes } from '@mui/material';
import logoIcon from '../assets/images/logoIcon.png';
import { standardBackgroundStyleNoPosition } from '../utils/backgroundStyles';

const rotate = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`;

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const float = keyframes`
  0% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-10px);
  }
  100% {
    transform: translateY(0px);
  }
`;

interface LoadingScreenProps {
  message?: string;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ message }) => {
  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        ...standardBackgroundStyleNoPosition,
        zIndex: 9999,
      }}
    >
      <Box
        sx={{
          position: 'relative',
          width: 120,
          height: 120,
          animation: `${float} 3s ease-in-out infinite`,
          mb: 3,
        }}
      >
        <img
          src={logoIcon}
          alt="Loading"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            filter: 'drop-shadow(0 0 20px rgba(99, 102, 241, 0.3))',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            top: -15,
            left: -15,
            right: -15,
            bottom: -15,
            border: '3px solid transparent',
            borderTopColor: 'rgba(99, 102, 241, 0.8)',
            borderRadius: '50%',
            animation: `${rotate} 2s cubic-bezier(0.4, 0, 0.2, 1) infinite`,
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            top: -8,
            left: -8,
            right: -8,
            bottom: -8,
            border: '3px solid transparent',
            borderTopColor: 'rgba(99, 102, 241, 0.4)',
            borderRadius: '50%',
            animation: `${rotate} 3s cubic-bezier(0.4, 0, 0.2, 1) infinite reverse`,
          }}
        />
      </Box>
      <Typography
        variant="h6"
        sx={{
          color: 'rgba(255, 255, 255, 0.9)',
          fontWeight: 500,
          animation: `${fadeIn} 0.8s ease-out forwards`,
          textAlign: 'center',
          letterSpacing: '0.5px',
        }}
      >
        {message || 'Loading...'}
      </Typography>
    </Box>
  );
};

export default LoadingScreen; 