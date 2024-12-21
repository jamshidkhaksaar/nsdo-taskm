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

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex' }}>
      {/* Drawer */}
      <Drawer
        variant="permanent"
        open={open}
        sx={{
          width: open ? DRAWER_WIDTH : 72,
          flexShrink: 0,
          whiteSpace: 'nowrap',
          boxSizing: 'border-box',
          transition: (theme) => theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
          '& .MuiDrawer-paper': {
            width: open ? DRAWER_WIDTH : 72,
            overflowX: 'hidden',
            backgroundColor: theme.palette.primary.dark,
            color: theme.palette.primary.contrastText,
            transition: (theme) => theme.transitions.create('width', {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
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

      {/* Create Board Dialog */}
      <Dialog 
        open={createBoardDialogOpen} 
        onClose={handleCreateBoardClose}
        maxWidth="sm"
        fullWidth
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

      {/* Main Content */}
      <Box 
        component="main" 
        sx={{ 
          flexGrow: 1, 
          p: 3,
          marginLeft: open ? `${DRAWER_WIDTH}px` : '72px',
          backgroundColor: '#f8fafc',
          transition: (theme) => theme.transitions.create('margin', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
        }}
      >
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
            <Typography variant="h4">My Boards</Typography>
            <Button 
              variant="contained" 
              color="primary"
              onClick={handleCreateBoardClick}
            >
              Create New Board
            </Button>
          </Box>

          {error && (
            <Typography color="error" sx={{ mb: 2 }}>
              {error}
            </Typography>
          )}

          <Grid container spacing={3}>
            {boards.map((board: Board) => (
              <Grid item xs={12} sm={6} md={4} key={board.id}>
                <Card>
                  <CardContent>
                    <Typography variant="h6">{board.title}</Typography>
                    <Typography variant="body2" color="textSecondary">
                      {board.description}
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button size="small" onClick={() => navigate(`/boards/${board.id}`)}>
                      View Board
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>
    </Box>
  );
};

export default Dashboard;