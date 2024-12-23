import React from 'react';
import { Box, keyframes } from '@mui/material';
import logoIcon from '../assets/images/logoIcon.png';

const pulse = keyframes`
  0% {
    transform: scale(0.95);
    opacity: 0.5;
  }
  50% {
    transform: scale(1.05);
    opacity: 0.8;
  }
  100% {
    transform: scale(0.95);
    opacity: 0.5;
  }
`;

const rotate = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`;

const LoadingScreen: React.FC = () => {
  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #1e2a78 0%, #ff3c7d 100%)',
        zIndex: 9999,
      }}
    >
      <Box
        sx={{
          position: 'relative',
          width: 100,
          height: 100,
          animation: `${pulse} 2s ease-in-out infinite`,
        }}
      >
        <img
          src={logoIcon}
          alt="Loading"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            top: -10,
            left: -10,
            right: -10,
            bottom: -10,
            border: '3px solid transparent',
            borderTopColor: '#fff',
            borderRadius: '50%',
            animation: `${rotate} 1s linear infinite`,
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            top: -5,
            left: -5,
            right: -5,
            bottom: -5,
            border: '3px solid transparent',
            borderTopColor: 'rgba(255, 255, 255, 0.5)',
            borderRadius: '50%',
            animation: `${rotate} 1.5s linear infinite reverse`,
          }}
        />
      </Box>
    </Box>
  );
};

export default LoadingScreen; 