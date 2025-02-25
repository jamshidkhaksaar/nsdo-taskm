import { keyframes } from '@mui/system';

export const useAnimations = () => {
  const slideDown = keyframes`
    from {
      transform: translateY(-100%);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  `;

  const slideUp = keyframes`
    from {
      transform: translateY(0);
      opacity: 1;
    }
    to {
      transform: translateY(-100%);
      opacity: 0;
    }
  `;

  const shakeAnimation = keyframes`
   0% { transform: rotate(0deg); }
   25% { transform: rotate(10deg); }
   50% { transform: rotate(0deg); }
   75% { transform: rotate(-10deg); }
   100% { transform: rotate(0deg); }
  `;

  const pulseAnimation = keyframes`
    0% { opacity: 0.6; }
    50% { opacity: 1; }
    100% { opacity: 0.6; }
  `;

  return {
    slideDown,
    slideUp,
    shakeAnimation,
    pulseAnimation
  };
}; 