import React, { useState } from 'react';
import { 
  Box, 
  Typography,
  IconButton,
  Tabs,
  Tab,
  Badge,
  Tooltip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;

  return (
    <Box
      role="tabpanel"
      hidden={value !== index}
      id={`tasks-tabpanel-${index}`}
      aria-labelledby={`tasks-tab-${index}`}
      {...other}
      sx={{ py: 2 }}
    >
      {value === index && children}
    </Box>
  );
};

const MyTasks: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Box
      sx={{
        p: 3,
        borderRadius: 3,
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        transition: 'all 0.3s ease',
        height: '100%',
        '&:hover': {
          boxShadow: '0 4px 20px 0 rgba(0,0,0,0.1)',
          transform: 'translateY(-2px)',
        },
      }}
    >
      {/* Header */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        mb: 3 
      }}>
        <Typography 
          variant="h6" 
          sx={{ 
            fontWeight: 700,
            letterSpacing: '0.5px',
            fontSize: '1.2rem',
            background: 'linear-gradient(45deg, #2E7D32 30%, #4CAF50 90%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textShadow: '0 0 20px rgba(46, 125, 50, 0.1)',
          }}
        >
          My Tasks
        </Typography>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{
            '& .MuiTab-root': {
              minHeight: '48px',
              textTransform: 'none',
              fontSize: '0.9rem',
            }
          }}
        >
          <Tab 
            icon={<AccessTimeIcon sx={{ fontSize: '1.1rem' }} />}
            iconPosition="start"
            label={
              <Badge 
                badgeContent={3} 
                color="primary"
                sx={{ 
                  '& .MuiBadge-badge': {
                    right: -15,
                  }
                }}
              >
                <span>Upcoming</span>
              </Badge>
            } 
          />
          <Tab 
            icon={<ErrorOutlineIcon sx={{ fontSize: '1.1rem' }} />}
            iconPosition="start"
            label={
              <Badge 
                badgeContent={2} 
                color="error"
                sx={{ 
                  '& .MuiBadge-badge': {
                    right: -15,
                  }
                }}
              >
                <span>Overdue</span>
              </Badge>
            }
          />
          <Tab 
            icon={<CheckCircleOutlineIcon sx={{ fontSize: '1.1rem' }} />}
            iconPosition="start"
            label={
              <Badge 
                badgeContent={5} 
                color="success"
                sx={{ 
                  '& .MuiBadge-badge': {
                    right: -15,
                  }
                }}
              >
                <span>Completed</span>
              </Badge>
            }
          />
        </Tabs>
      </Box>

      {/* Tab Panels */}
      <TabPanel value={tabValue} index={0}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Tooltip title="Add new task" placement="left">
              <IconButton 
                size="small"
                sx={{ 
                  bgcolor: 'primary.main',
                  color: 'white',
                  width: 36,
                  height: 36,
                  '&:hover': {
                    bgcolor: 'primary.dark',
                    transform: 'scale(1.1)',
                  },
                  transition: 'all 0.2s ease-in-out',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                }}
              >
                <AddIcon />
              </IconButton>
            </Tooltip>
          </Box>
          <Typography variant="body2" color="text.secondary" align="center">
            No upcoming tasks
          </Typography>
        </Box>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Box 
          sx={{ 
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
            py: 4
          }}
        >
          <ErrorOutlineIcon 
            sx={{ 
              fontSize: '48px',
              color: 'error.light',
              opacity: 0.6
            }}
          />
          <Typography variant="body2" color="text.secondary" align="center">
            No overdue tasks
          </Typography>
        </Box>
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <Box 
          sx={{ 
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
            py: 4
          }}
        >
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            gap: 1
          }}>
            <Box sx={{ 
              display: 'flex', 
              gap: 1,
              opacity: 0.6
            }}>
              <Box sx={{ 
                width: 120,
                height: 8,
                bgcolor: 'success.light',
                borderRadius: 4
              }} />
              <Box sx={{ 
                width: 80,
                height: 8,
                bgcolor: 'success.light',
                borderRadius: 4
              }} />
            </Box>
            <Typography variant="body2" color="text.secondary">
              Your completed tasks will appear here, so you can
            </Typography>
            <Typography variant="body2" color="text.secondary">
              reference them later.
            </Typography>
          </Box>
        </Box>
      </TabPanel>
    </Box>
  );
};

export default MyTasks; 