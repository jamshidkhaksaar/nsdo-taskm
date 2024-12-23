import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  CircularProgress,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import LogoutIcon from '@mui/icons-material/Logout';
import MenuIcon from '@mui/icons-material/Menu';
import { AppDispatch, RootState } from '../store';
import { fetchBoards } from '../store/slices/boardSlice';
import { logout, createBoard } from '../services/api';
import { logoutSuccess } from '../store/slices/authSlice';
import logo from '../assets/images/logo.png';
import { Board } from '../types';
import BusinessIcon from '@mui/icons-material/Business';
import PersonIcon from '@mui/icons-material/Person';
import SettingsIcon from '@mui/icons-material/Settings';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import logoIcon from '../assets/images/logoIcon.png';
import { Tooltip } from '@mui/material';
import { keyframes } from '@mui/system';
import GitHubIcon from '@mui/icons-material/GitHub';
import LinkedInIcon from '@mui/icons-material/LinkedIn';


const DRAWER_WIDTH = 240;

const Dashboard: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const [createBoardDialogOpen, setCreateBoardDialogOpen] = useState(false);
  const [newBoard, setNewBoard] = useState({ title: '', description: '' });
  
  const { 
    boards, 
    loading, 
    error 
  } = useSelector((state: RootState) => state.board);
  
  const { 
    isAuthenticated, 
    token 
  } = useSelector((state: RootState) => state.auth);

  React.useEffect(() => {
    if (!isAuthenticated || !token) {
      navigate('/login');
      return;
    }

    const fetchData = async () => {
      try {
        console.log('Fetching boards...');
        const result = await dispatch(fetchBoards()).unwrap();
        console.log('Boards fetched:', result);
      } catch (error) {
        console.error('Error fetching boards:', error);
        // Show an error message to the user
        alert('Failed to fetch boards. Please try again or contact support.');
      }
    };

    fetchData();
  }, [dispatch, isAuthenticated, token, navigate]);

  console.log('Dashboard render - boards:', boards);
  console.log('Dashboard render - loading:', loading);
  console.log('Dashboard render - error:', error);

  const handleLogout = async () => {
    try {
      await logout();
      dispatch(logoutSuccess());
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const toggleDrawer = () => {
    setOpen(!open);
  };

  const handleCreateBoardClick = () => {
    setCreateBoardDialogOpen(true);
  };

  const handleCreateBoardClose = () => {
    setCreateBoardDialogOpen(false);
    setNewBoard({ title: '', description: '' });
  };

  const handleCreateBoard = async () => {
    try {
      await createBoard({
        title: newBoard.title,
        description: newBoard.description
      });
      
      // Refresh boards after creating a new one
      await dispatch(fetchBoards()).unwrap();
      
      handleCreateBoardClose();
    } catch (error) {
      console.error('Error creating board:', error);
      // Optionally, show an error message to the user
    }
  };

  const fadeIn = keyframes`
    from {
      opacity: 0;
      transform: translateY(-20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  `;

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', background: 'linear-gradient(135deg, #1e2a78 0%, #ff3c7d 100%)' }}>
      {/* Drawer */}
      <Drawer
        variant="permanent"
        open={open}
        sx={{
          width: open ? DRAWER_WIDTH : 72,
          flexShrink: 0,
          whiteSpace: 'nowrap',
          boxSizing: 'border-box',
          '& .MuiDrawer-paper': {
            width: open ? DRAWER_WIDTH : 72,
            overflowX: 'hidden',
            background: 'rgba(30, 42, 120, 0.8)',
            backdropFilter: 'blur(8px)',
            borderRight: '1px solid rgba(255, 255, 255, 0.18)',
            color: '#fff',
          },
        }}
      >
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <List>
            {/* Logo */}
            <ListItem sx={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              py: 2,
              px: open ? 2 : 1,
            }}>
              {open ? (
                // Full logo for expanded drawer
                <img 
                  src={logo} 
                  alt="Company Logo" 
                  style={{ 
                    maxWidth: 150,
                    height: 'auto',
                    objectFit: 'contain'
                  }} 
                />
              ) : (
                // Icon only for collapsed drawer
                <img 
                  src={logoIcon}  // Make sure to import this
                  alt="Company Icon" 
                  style={{ 
                    width: 40,
                    height: 40,
                    objectFit: 'contain'
                  }} 
                />
              )}
            </ListItem>

            {/* Toggle Drawer Button */}
            <Tooltip title="Toggle Drawer">
            <ListItem>
              <IconButton 
                onClick={toggleDrawer} 
                sx={{ 
                  color: theme.palette.primary.contrastText,
                  '&:hover': {
                    backgroundColor: 'rgba(255,255,255,0.1)',
                  }
                }}
              >
                <MenuIcon />
              </IconButton>
            </ListItem>
            </Tooltip>
            {/* Dashboard Navigation */}
            <Tooltip title="Dashboard">
            <ListItem 
              button 
              onClick={() => navigate('/dashboard')}
              sx={{
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.1)',
                }
              }}
            >
              <ListItemIcon sx={{ color: theme.palette.primary.contrastText }}>
                <DashboardIcon />
              </ListItemIcon>
              <ListItemText primary="Dashboard" />
            </ListItem>
            </Tooltip>
            {/* Departments */}
            <Tooltip title="Departments">
            <ListItem 
              button 
              onClick={() => navigate('/departments')}
              sx={{
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.1)',
                }
              }}
            >
              <ListItemIcon sx={{ color: theme.palette.primary.contrastText }}>
                <BusinessIcon />
              </ListItemIcon>
              <ListItemText primary="Departments" />
            </ListItem>
            </Tooltip>

            {/* Users */}
            <Tooltip title="Users">
            <ListItem 
              button 
              onClick={() => navigate('/users')}
              sx={{
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.1)',
                }
              }}
            >
              <ListItemIcon sx={{ color: theme.palette.primary.contrastText }}>
                <PersonIcon />
              </ListItemIcon>
              <ListItemText primary="Users" />
            </ListItem>
            </Tooltip>

            {/* Settings */}
            <Tooltip title="Settings">
            <ListItem
              button 
              onClick={() => navigate('/settings')}
              sx={{
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.1)',
                }
              }}
            >
              <ListItemIcon sx={{ color: theme.palette.primary.contrastText }}>
                <SettingsIcon />
              </ListItemIcon>
              <ListItemText primary="Settings" />
            </ListItem>
            </Tooltip>

            {/* Admin Panel */}
            <Tooltip title="Admin Panel">
            <ListItem
              button 
              onClick={() => navigate('/admin')}
              sx={{
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.1)',
                }
              }}
            >
              <ListItemIcon sx={{ color: theme.palette.primary.contrastText }}>
                <AdminPanelSettingsIcon />
              </ListItemIcon>
              <ListItemText primary="Admin Panel" />
            </ListItem>
            </Tooltip>
          </List>

          {/* Logout at bottom */}
          <List sx={{ marginTop: 'auto' }}>
            <Tooltip title="Logout">
              <ListItem 
                button 
                onClick={handleLogout}
                sx={{
                  '&:hover': {
                    backgroundColor: 'rgba(255,255,255,0.1)',
                  }
                }}
            >
              <ListItemIcon sx={{ color: theme.palette.primary.contrastText }}>
                <LogoutIcon />
              </ListItemIcon>
              <ListItemText primary="Logout" />
            </ListItem>
            </Tooltip>
          </List>
        </Box>
      </Drawer>

      {/* Main Content - Updated styling */}
      <Box 
        component="main" 
        sx={{ 
          flexGrow: 1,
          minHeight: '100vh',
          p: 3,
          pb: 8,
          transition: theme.transitions.create('margin', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
          marginLeft: 0,
          backgroundImage: `
            url("data:image/svg+xml,%3Csvg width='100%' height='100%' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='network' x='0' y='0' width='40' height='40' patternUnits='userSpaceOnUse'%3E%3Cpath d='M0 0h40v40H0z' fill='none'/%3E%3Ccircle cx='20' cy='20' r='1' fill='rgba(255,255,255,0.3)'/%3E%3Cpath d='M0 20h40M20 0v40' stroke='rgba(255,255,255,0.1)' stroke-width='0.5'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100%' height='100%' fill='url(%23network)'/%3E%3C/svg%3E")
          `,
        }}
      >
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
          <Box 
            display="flex" 
            justifyContent="space-between" 
            alignItems="center" 
            mb={4}
            sx={{ animation: `${fadeIn} 0.8s ease-out` }}
          >
            <Typography 
              variant="h4" 
              sx={{ 
                color: '#fff',
                textShadow: '2px 2px 4px rgba(0,0,0,0.2)',
                fontWeight: '600'
              }}
            >
              My Boards
            </Typography>
            <Button 
              variant="contained" 
              onClick={handleCreateBoardClick}
              sx={{
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: '#fff',
                '&:hover': {
                  background: 'rgba(255, 255, 255, 0.2)',
                },
              }}
            >
              Create New Board
            </Button>
          </Box>

          <Grid container spacing={3}>
            {boards.map((board: Board, index) => (
              <Grid item xs={12} sm={6} md={4} key={board.id}>
                <Card 
                  sx={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(255, 255, 255, 0.18)',
                    boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
                    animation: `${fadeIn} ${0.4 + index * 0.1}s ease-out`,
                    transition: 'transform 0.2s ease-in-out',
                    '&:hover': {
                      transform: 'translateY(-5px)',
                    },
                  }}
                >
                  <CardContent>
                    <Typography 
                      variant="h6" 
                      sx={{ color: '#fff', textShadow: '1px 1px 2px rgba(0,0,0,0.2)' }}
                    >
                      {board.title}
                    </Typography>
                    <Typography 
                      variant="body2" 
                      sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
                    >
                      {board.description}
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button 
                      size="small" 
                      onClick={() => navigate(`/boards/${board.id}`)}
                      sx={{
                        color: '#fff',
                        '&:hover': {
                          background: 'rgba(255, 255, 255, 0.1)',
                        },
                      }}
                    >
                      View Board
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Add the footer before the closing Box */}
      <Box
        component="footer"
        sx={{
          position: 'fixed',
          bottom: 0,
          right: 0,
          width: `calc(100% - ${open ? DRAWER_WIDTH : 72}px)`,
          padding: '0.5rem',
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(8px)',
          borderTop: '1px solid rgba(255, 255, 255, 0.18)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 1,
          transition: theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
          zIndex: 2,
        }}
      >
        <Typography
          variant="caption"
          sx={{
            color: 'rgba(255, 255, 255, 0.9)',
            fontWeight: 500,
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
              padding: '4px',
              '&:hover': {
                background: 'rgba(255, 255, 255, 0.1)',
                transform: 'translateY(-2px)',
              },
              transition: 'transform 0.2s ease-in-out',
            }}
          >
            <GitHubIcon sx={{ fontSize: '1.2rem' }} />
          </IconButton>
          <IconButton
            component="a"
            href="https://linkedin.com/in/jamshid-khaksaar"
            target="_blank"
            rel="noopener noreferrer"
            size="small"
            sx={{
              color: 'rgba(255, 255, 255, 0.9)',
              padding: '4px',
              '&:hover': {
                background: 'rgba(255, 255, 255, 0.1)',
                transform: 'translateY(-2px)',
              },
              transition: 'transform 0.2s ease-in-out',
            }}
          >
            <LinkedInIcon sx={{ fontSize: '1.2rem' }} />
          </IconButton>
        </Box>
      </Box>

      {/* Create Board Dialog with updated styling */}
      <Dialog 
        open={createBoardDialogOpen} 
        onClose={handleCreateBoardClose}
        PaperProps={{
          sx: {
            background: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(8px)',
            borderRadius: '16px',
            boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
          }
        }}
      >
        <DialogTitle>Create New Board</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Board Title"
            type="text"
            fullWidth
            variant="outlined"
            value={newBoard.title}
            onChange={(e) => setNewBoard(prev => ({ ...prev, title: e.target.value }))}
          />
          <TextField
            margin="dense"
            label="Board Description"
            type="text"
            fullWidth
            variant="outlined"
            multiline
            rows={3}
            value={newBoard.description}
            onChange={(e) => setNewBoard(prev => ({ ...prev, description: e.target.value }))}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCreateBoardClose} color="secondary">
            Cancel
          </Button>
          <Button 
            onClick={handleCreateBoard} 
            color="primary" 
            variant="contained"
            disabled={!newBoard.title}
          >
            Create Board
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Dashboard;