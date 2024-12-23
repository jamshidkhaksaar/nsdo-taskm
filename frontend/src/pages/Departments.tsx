import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  IconButton,
  Tooltip,
  Badge,
  Avatar,
  Menu,
  MenuItem,
  ListItemIcon,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PeopleIcon from '@mui/icons-material/People';
import LoadingScreen from '../components/LoadingScreen';
import NotificationsIcon from '@mui/icons-material/Notifications';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import SettingsIcon from '@mui/icons-material/Settings';
import { useNavigate } from 'react-router-dom';
import GitHubIcon from '@mui/icons-material/GitHub';
import LinkedInIcon from '@mui/icons-material/LinkedIn';

const DRAWER_WIDTH = 240;

interface Department {
  id: number;
  name: string;
  description: string;
  employeeCount: number;
  head: string;
}

const Departments: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [notifications, setNotifications] = useState(3);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const openMenu = Boolean(anchorEl);
  const [departments] = useState<Department[]>([
    {
      id: 1,
      name: 'Human Resources',
      description: 'Manages employee relations and recruitment',
      employeeCount: 15,
      head: 'John Doe'
    },
    {
      id: 2,
      name: 'Information Technology',
      description: 'Handles technical infrastructure and support',
      employeeCount: 30,
      head: 'Jane Smith'
    },
  ]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  const handleProfileClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationClick = () => {
    setNotifications(0);
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <Box
      sx={{
        flexGrow: 1,
        minHeight: '100vh',
        marginLeft: { xs: 0, sm: `${72}px`, md: `${DRAWER_WIDTH}px` },
        p: 3,
        pb: 8,
        background: 'linear-gradient(135deg, #1e2a78 0%, #ff3c7d 100%)',
        backgroundImage: `
          url("data:image/svg+xml,%3Csvg width='100%' height='100%' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='network' x='0' y='0' width='40' height='40' patternUnits='userSpaceOnUse'%3E%3Cpath d='M0 0h40v40H0z' fill='none'/%3E%3Ccircle cx='20' cy='20' r='1' fill='rgba(255,255,255,0.3)'/%3E%3Cpath d='M0 20h40M20 0v40' stroke='rgba(255,255,255,0.1)' stroke-width='0.5'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100%' height='100%' fill='url(%23network)'/%3E%3C/svg%3E")
        `,
        position: 'relative',
        zIndex: 1,
      }}
    >
      {/* Top Navigation Bar */}
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'flex-end', 
          alignItems: 'center',
          gap: 2,
          p: 2,
          position: 'relative',
          zIndex: 2,
        }}
      >
        <IconButton
          onClick={handleNotificationClick}
          sx={{
            color: '#fff',
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255, 255, 255, 0.18)',
            '&:hover': {
              background: 'rgba(255, 255, 255, 0.2)',
            },
          }}
        >
          <Badge badgeContent={notifications} color="error">
            <NotificationsIcon />
          </Badge>
        </IconButton>

        <IconButton
          onClick={handleProfileClick}
          sx={{
            color: '#fff',
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255, 255, 255, 0.18)',
            '&:hover': {
              background: 'rgba(255, 255, 255, 0.2)',
            },
          }}
        >
          <Avatar sx={{ width: 32, height: 32 }}>
            <AccountCircleIcon />
          </Avatar>
        </IconButton>

        <Menu
          anchorEl={anchorEl}
          open={openMenu}
          onClose={handleProfileClose}
          onClick={handleProfileClose}
          PaperProps={{
            sx: {
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255, 255, 255, 0.18)',
              boxShadow: '0 4px 16px 0 rgba(31, 38, 135, 0.37)',
              color: '#fff',
              mt: 1.5,
              '& .MuiMenuItem-root': {
                '&:hover': {
                  background: 'rgba(255, 255, 255, 0.1)',
                },
              },
            },
          }}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          <MenuItem onClick={() => navigate('/profile')}>
            <ListItemIcon>
              <AccountCircleIcon sx={{ color: '#fff' }} />
            </ListItemIcon>
            Profile
          </MenuItem>
          <MenuItem onClick={() => navigate('/settings')}>
            <ListItemIcon>
              <SettingsIcon sx={{ color: '#fff' }} />
            </ListItemIcon>
            Settings
          </MenuItem>
        </Menu>
      </Box>

      {/* Main Content */}
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4, flex: 1 }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          mb: 4 
        }}>
          <Typography
            variant="h4"
            sx={{
              color: '#fff',
              fontWeight: 600,
              textShadow: '2px 2px 4px rgba(0,0,0,0.2)',
            }}
          >
            Departments
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            sx={{
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255, 255, 255, 0.18)',
              color: '#fff',
              '&:hover': {
                background: 'rgba(255, 255, 255, 0.2)',
                transform: 'translateY(-2px)',
              },
              transition: 'all 0.2s ease-in-out',
            }}
          >
            Add Department
          </Button>
        </Box>

        <Grid container spacing={3}>
          {departments.length === 0 ? (
            <Grid item xs={12}>
              <Card
                sx={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(8px)',
                  border: '1px dashed rgba(255, 255, 255, 0.18)',
                  textAlign: 'center',
                  py: 4,
                }}
              >
                <Typography
                  variant="body1"
                  sx={{
                    color: 'rgba(255, 255, 255, 0.7)',
                    fontStyle: 'italic',
                  }}
                >
                  No departments found
                </Typography>
              </Card>
            </Grid>
          ) : (
            departments.map((department) => (
              <Grid item xs={12} md={6} key={department.id}>
                <Card
                  sx={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(255, 255, 255, 0.18)',
                    transition: 'transform 0.2s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                    },
                  }}
                >
                  <CardContent>
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'flex-start',
                      mb: 2 
                    }}>
                      <Typography variant="h6" sx={{ color: '#fff' }}>
                        {department.name}
                      </Typography>
                      <Box>
                        <Tooltip title="Edit Department">
                          <IconButton
                            size="small"
                            sx={{
                              color: '#fff',
                              mr: 1,
                              '&:hover': {
                                background: 'rgba(255, 255, 255, 0.1)',
                              },
                            }}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete Department">
                          <IconButton
                            size="small"
                            sx={{
                              color: '#fff',
                              '&:hover': {
                                background: 'rgba(255, 255, 255, 0.1)',
                              },
                            }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: 'rgba(255, 255, 255, 0.7)',
                        mb: 2 
                      }}
                    >
                      {department.description}
                    </Typography>
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      mt: 2,
                      pt: 2,
                      borderTop: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PeopleIcon sx={{ color: 'rgba(255, 255, 255, 0.7)' }} />
                        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                          {department.employeeCount} Employees
                        </Typography>
                      </Box>
                      <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                        Head: {department.head}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))
          )}
        </Grid>
      </Container>

      {/* Footer */}
      <Box
        component="footer"
        sx={{
          position: 'fixed',
          bottom: 0,
          right: 0,
          left: { xs: 0, sm: 72, md: DRAWER_WIDTH },
          padding: '0.5rem',
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(8px)',
          borderTop: '1px solid rgba(255, 255, 255, 0.18)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 1,
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
    </Box>
  );
};

export default Departments; 