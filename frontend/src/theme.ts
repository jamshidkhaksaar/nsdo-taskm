import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#90caf9',
      light: '#64b5f6',
      dark: '#f50057',
    },
    secondary: {
      main: '#f50057',
      light: '#ff4081',
      dark: '#c51162',
    },
    background: {
      default: '#121212',
      paper: '#1e1e1e',
    },
    text: {
      primary: '#ffffff',
      secondary: '#b0bec5',
    },
  },
  typography: {
    fontFamily: [
      'Roboto',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Arial',
      'sans-serif',
    ].join(','),
    h5: {
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
        },
      },
    },
    MuiInputBase: {
      styleOverrides: {
        root: {
          color: '#ffffff',
        },
        input: {
          color: '#ffffff',
          '&:-webkit-autofill': {
            WebkitBoxShadow: '0 0 0 100px #266798 inset',
            WebkitTextFillColor: '#fff',
            caretColor: '#fff',
          },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(255, 255, 255, 0.23)',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(255, 255, 255, 0.5)',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#90caf9',
          },
        },
        input: {
          color: '#ffffff',
        },
        notchedOutline: {
           borderColor: 'rgba(255, 255, 255, 0.23)',
        }
      },
    },
    MuiSelect: {
      styleOverrides: {
        select: {
          color: '#ffffff',
        },
        icon: {
          color: 'rgba(255, 255, 255, 0.54)',
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          color: '#b0bec5',
          '&.Mui-focused': {
            color: '#90caf9',
          },
        },
      },
    },
    MuiMenuItem: {
        styleOverrides: {
            root: {
                color: '#ffffff',
                backgroundColor: '#1e1e1e',
                '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.08)'
                },
                '&.Mui-selected': {
                    backgroundColor: 'rgba(144, 202, 249, 0.16)',
                    '&:hover': {
                        backgroundColor: 'rgba(144, 202, 249, 0.24)'
                    }
                }
            }
        }
    },
  },
});

export default theme; 