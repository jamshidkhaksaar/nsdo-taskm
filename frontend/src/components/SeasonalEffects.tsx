import React from 'react';
import { Box, keyframes } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useWeather } from '../context/WeatherContext';

// Keyframes for different animations
const rainAnimation = keyframes`
  0% {
    transform: translateY(0);
  }
  100% {
    transform: translateY(20px);
  }
`;

const floatAnimation = keyframes`
  0%, 100% {
    transform: translateX(0);
  }
  50% {
    transform: translateX(5px);
  }
`;

const pulseAnimation = keyframes`
  0%, 100% {
    opacity: 0.1;
  }
  50% {
    opacity: 0.2;
  }
`;

// Styled components for different weather elements
const Snowflake = styled('div')`
  position: absolute;
  color: rgba(255, 255, 255, 0.15);
  font-size: 8px;
  animation: ${floatAnimation} 3s ease-in-out infinite;
  z-index: 1;
  pointer-events: none;
`;

const RainSection = styled('div')`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 20px;
  display: flex;
  justify-content: space-around;
  opacity: 0.15;
`;

const Raindrop = styled('div')`
  width: 1px;
  height: 8px;
  background: linear-gradient(to bottom, transparent, rgba(70, 130, 180, 0.3));
  animation: ${rainAnimation} 1s linear infinite;
`;

const Cloud = styled('div')`
  position: absolute;
  color: rgba(169, 169, 169, 0.15);
  font-size: 16px;
  animation: ${floatAnimation} 4s ease-in-out infinite;
  z-index: 1;
  pointer-events: none;
`;

const Lightning = styled('div')`
  position: absolute;
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.02);
  animation: ${pulseAnimation} 8s ease-in-out infinite;
  z-index: 1;
  pointer-events: none;
`;

const SunRay = styled('div')`
  position: absolute;
  background: linear-gradient(to right, rgba(255, 215, 0, 0.05), transparent);
  height: 1px;
  width: 40px;
  animation: ${pulseAnimation} 4s ease-in-out infinite;
  z-index: 1;
  pointer-events: none;
`;

const SeasonalEffects: React.FC = () => {
  const { weather } = useWeather();

  if (!weather) return null;

  const elements: JSX.Element[] = [];
  const count = 6; // Fixed number of elements

  // Create fixed positions for elements
  const positions = Array.from({ length: count }, (_, i) => ({
    left: `${(100 / count) * i}%`,
    animationDelay: `${(2 / count) * i}s`
  }));

  if (weather.weatherCode >= 71 && weather.weatherCode <= 77) {
    // Snow - gentle floating
    return (
      <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden' }}>
        {positions.map((pos, i) => (
          <Snowflake 
            key={i} 
            style={{ 
              ...pos,
              top: `${Math.random() * 40}%`
            }}
          >
            •
          </Snowflake>
        ))}
      </Box>
    );
  } else if (
    (weather.weatherCode >= 51 && weather.weatherCode <= 67) || // Drizzle
    (weather.weatherCode >= 80 && weather.weatherCode <= 82)    // Rain showers
  ) {
    // Rain - continuous stream
    return (
      <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden' }}>
        <RainSection>
          {positions.map((pos, i) => (
            <Raindrop key={i} style={pos} />
          ))}
        </RainSection>
      </Box>
    );
  } else if (weather.weatherCode >= 95 && weather.weatherCode <= 99) {
    // Thunderstorm
    return (
      <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden' }}>
        <Lightning />
        <RainSection style={{ opacity: 0.2 }}>
          {positions.map((pos, i) => (
            <Raindrop 
              key={i} 
              style={{
                ...pos,
                height: '12px'
              }} 
            />
          ))}
        </RainSection>
      </Box>
    );
  } else if (weather.weatherCode >= 2 && weather.weatherCode <= 3) {
    // Cloudy - gentle floating
    return (
      <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden' }}>
        {positions.slice(0, 4).map((pos, i) => (
          <Cloud 
            key={i} 
            style={{ 
              ...pos,
              top: `${10 + (Math.random() * 20)}%`
            }}
          >
            •
          </Cloud>
        ))}
      </Box>
    );
  } else if (weather.weatherCode <= 1) {
    // Clear/Sunny - subtle pulsing rays
    return (
      <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden' }}>
        {positions.map((pos, i) => (
          <SunRay
            key={i}
            style={{
              ...pos,
              top: '20%',
              transform: `rotate(${(i * 60)}deg)`,
              transformOrigin: '0 50%',
            }}
          />
        ))}
      </Box>
    );
  }

  return (
    <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden' }}>
      {elements}
    </Box>
  );
};

export default SeasonalEffects; 