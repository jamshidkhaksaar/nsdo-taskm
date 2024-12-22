import React from 'react';
import { 
  AppBar, 
  Toolbar, 
  InputBase, 
  Avatar,
  Box,
  styled,
  IconButton,
  Typography,
  alpha,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import NotificationsIcon from '@mui/icons-material/Notifications';
import MenuIcon from '@mui/icons-material/Menu';
import { useNavigate } from 'react-router-dom';

const Search = styled('div')(({ theme }) => ({
  position: 'relative',
  borderRadius: 20,
  backgroundColor: alpha(theme.palette.background.default, 0.9),
  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  '&:hover': {
    backgroundColor: theme.palette.background.paper,
    border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
    boxShadow: `0 0 0 4px ${alpha(theme.palette.primary.main, 0.05)}`,
  },
  width: '100%',
  maxWidth: '500px',
  transition: theme.transitions.create(['background-color', 'border-color', 'box-shadow'], {
    duration: theme.transitions.duration.shorter,
  }),
}));

const SearchIconWrapper = styled('div')(({ theme }) => ({
  padding: theme.spacing(0, 2),
  height: '100%',
  position: 'absolute',
  pointerEvents: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: alpha(theme.palette.primary.main, 0.7),
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
  color: theme.palette.text.primary,
  width: '100%',
  '& .MuiInputBase-input': {
    padding: theme.spacing(1.5, 1.5, 1.5, 0),
    paddingLeft: `calc(1em + ${theme.spacing(4)})`,
    width: '100%',
    fontSize: '0.9rem',
    '&::placeholder': {
      color: alpha(theme.palette.text.primary, 0.6),
      opacity: 1,
    },
    transition: theme.transitions.create('width'),
  },
}));

const StyledMenuIcon = styled(MenuIcon)(({ theme }) => ({
  background: 'linear-gradient(45deg, #2E7D32 30%, #4CAF50 90%)',
  backgroundClip: 'text',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  fontSize: '28px',
}));

export interface NavbarProps {
  open: boolean;
  drawerWidth: number;
  onDrawerToggle: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ open, drawerWidth, onDrawerToggle }) => {
  const navigate = useNavigate();
  const collapsedWidth = 72;

  return (
    <AppBar 
      position="fixed" 
      elevation={0}
      sx={{ 
        zIndex: (theme) => theme.zIndex.drawer + 1,
        width: { sm: `calc(100% - ${open ? drawerWidth : collapsedWidth}px)` },
        ml: { sm: `${open ? drawerWidth : collapsedWidth}px` },
        transition: (theme) => theme.transitions.create(['width', 'margin'], {
          easing: theme.transitions.easing.sharp,
          duration: theme.transitions.duration.enteringScreen,
        }),
      }}
    >
      <Toolbar sx={{ height: 72, gap: 2 }}>
        {/* Left Section */}
        <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 200 }}>
          <IconButton
            aria-label="toggle drawer"
            onClick={onDrawerToggle}
            edge="start"
            sx={{ 
              mr: 2,
              '&:hover': {
                bgcolor: alpha('#4CAF50', 0.08),
              }
            }}
          >
            <StyledMenuIcon />
          </IconButton>
          
          <Typography
            variant="h6"
            noWrap
            component="div"
            sx={{
              fontWeight: 700,
              letterSpacing: '0.5px',
              fontSize: { xs: '1rem', sm: '1.2rem', md: '1.3rem' },
              display: { xs: 'none', sm: 'block' },
              background: 'linear-gradient(45deg, #2E7D32 30%, #4CAF50 90%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: '0 0 20px rgba(46, 125, 50, 0.1)',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'scale(1.02)',
              }
            }}
          >
            NSDO Task Management
          </Typography>
        </Box>

        {/* Center Section with Search */}
        <Box sx={{ 
          display: 'flex', 
          flexGrow: 1, 
          justifyContent: 'center',
          ml: 8,
        }}>
          <Search>
            <SearchIconWrapper>
              <SearchIcon />
            </SearchIconWrapper>
            <StyledInputBase
              placeholder="Search tasks, projects, or documents..."
              inputProps={{ 'aria-label': 'search' }}
            />
          </Search>
        </Box>

        {/* Right Section */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, minWidth: 100 }}>
          <IconButton 
            color="inherit"
            sx={{ 
              '&:hover': { 
                bgcolor: 'rgba(255, 255, 255, 0.1)' 
              }
            }}
          >
            <NotificationsIcon />
          </IconButton>
          <Avatar 
            sx={{ 
              width: 36,
              height: 36,
              cursor: 'pointer',
              bgcolor: 'primary.main',
              '&:hover': {
                opacity: 0.8,
              }
            }}
            onClick={() => navigate('/profile')}
          >
            JK
          </Avatar>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;