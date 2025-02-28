/**
 * Glassmorphism styles for the application
 * Provides consistent styling for input fields, forms, and other UI elements
 */

import { Theme } from '@mui/material';

// Glassmorphism styles for input fields
export const glassmorphismInputStyle = {
  backgroundColor: 'rgba(255, 255, 255, 0.1)',
  backdropFilter: 'blur(10px)',
  borderRadius: '10px',
  '& fieldset': {
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  '&:hover fieldset': {
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  '&.Mui-focused fieldset': {
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
  '& input, & textarea': {
    color: 'white',
  },
  '& .MuiSelect-select': {
    color: 'white',
  },
  '& .MuiInputAdornment-root .MuiSvgIcon-root': {
    color: 'rgba(255, 255, 255, 0.7)',
  },
};

// Glassmorphism styles for form containers
export const glassmorphismFormStyle = {
  backgroundColor: 'rgba(255, 255, 255, 0.15)',
  backdropFilter: 'blur(12px)',
  borderRadius: '16px',
  border: '1px solid rgba(255, 255, 255, 0.18)',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
  padding: '24px',
};

// Glassmorphism styles for buttons
export const glassmorphismButtonStyle = {
  backgroundColor: 'rgba(255, 255, 255, 0.2)',
  backdropFilter: 'blur(10px)',
  color: 'white',
  border: '1px solid rgba(255, 255, 255, 0.3)',
  borderRadius: '10px',
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    boxShadow: '0 6px 25px rgba(0, 0, 0, 0.2)',
  },
};

// Glassmorphism styles for cards
export const glassmorphismCardStyle = {
  backgroundColor: 'rgba(255, 255, 255, 0.1)',
  backdropFilter: 'blur(10px)',
  borderRadius: '16px',
  border: '1px solid rgba(255, 255, 255, 0.18)',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
};

// Function to get theme-aware glassmorphism styles
export const getGlassmorphismStyles = (theme: Theme) => ({
  input: {
    ...glassmorphismInputStyle,
    '& .MuiFormHelperText-root': {
      color: theme.palette.error.light,
    },
  },
  form: glassmorphismFormStyle,
  button: glassmorphismButtonStyle,
  card: glassmorphismCardStyle,
  // Label styles for inputs
  inputLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  // Text styles
  text: {
    primary: { color: 'white' },
    secondary: { color: 'rgba(255, 255, 255, 0.8)' },
    muted: { color: 'rgba(255, 255, 255, 0.6)' },
  },
}); 