import { createTheme } from '@mui/material/styles';

// Solarized Dark Color Palette
const colors = {
  base03: '#002b36',
  base02: '#073642',
  base01: '#586e75',
  base00: '#657b83',
  base0: '#839496',
  base1: '#93a1a1',
  base2: '#eee8d5',
  base3: '#fdf6e3',
  yellow: '#b58900',
  orange: '#cb4b16',
  red: '#dc322f',
  magenta: '#d33682',
  violet: '#6c71c4',
  blue: '#268bd2',
  cyan: '#2aa198',
  green: '#859900',
};

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: colors.blue,
      light: colors.cyan,
      dark: colors.violet,
      contrastText: colors.base3,
    },
    secondary: {
      main: colors.cyan,
      light: colors.blue,
      dark: colors.violet,
      contrastText: colors.base3,
    },
    background: {
      default: colors.base03,
      paper: colors.base02,
    },
    text: {
      primary: colors.base1,
      secondary: colors.base0,
    },
    divider: colors.base01,
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2rem',
      fontWeight: 600,
      color: colors.base2,
    },
    h2: {
      fontSize: '1.5rem',
      fontWeight: 600,
      color: colors.base2,
    },
    h3: {
      fontSize: '1.25rem',
      fontWeight: 600,
      color: colors.base2,
    },
    h4: {
      color: colors.base2,
    },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: colors.base02,
          borderRadius: '12px',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          textTransform: 'none',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: colors.base02,
          borderColor: colors.base01,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: colors.base02,
          borderBottom: `1px solid ${colors.base01}`,
        },
      },
    },
  },
});

export default theme; 