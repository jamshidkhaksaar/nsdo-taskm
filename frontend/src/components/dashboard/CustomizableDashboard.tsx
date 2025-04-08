import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  Button, 
  ToggleButtonGroup, 
  ToggleButton,
  Tooltip,
  IconButton,
  useTheme
} from '@mui/material';
import Responsive, { WidthProvider } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import SettingsIcon from '@mui/icons-material/Settings';
import RefreshIcon from '@mui/icons-material/Refresh';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import { DASHBOARD_PERIODS } from '../../constants';

// Wrap the Responsive component with the WidthProvider which auto detects width
const ResponsiveGridLayout = WidthProvider(Responsive);

// Default layout configuration
const defaultLayouts = {
  lg: [
    { i: 'completion-rate', x: 0, y: 0, w: 6, h: 8, minW: 4, minH: 6 },
    { i: 'productivity-metrics', x: 6, y: 0, w: 6, h: 8, minW: 4, minH: 6 },
    { i: 'task-distribution', x: 0, y: 8, w: 6, h: 9, minW: 4, minH: 6 },
    { i: 'task-recommendations', x: 6, y: 8, w: 6, h: 9, minW: 4, minH: 6 },
  ],
  md: [
    { i: 'completion-rate', x: 0, y: 0, w: 6, h: 8, minW: 3, minH: 6 },
    { i: 'productivity-metrics', x: 6, y: 0, w: 6, h: 8, minW: 3, minH: 6 },
    { i: 'task-distribution', x: 0, y: 8, w: 6, h: 9, minW: 3, minH: 6 },
    { i: 'task-recommendations', x: 6, y: 8, w: 6, h: 9, minW: 3, minH: 6 },
  ],
  sm: [
    { i: 'completion-rate', x: 0, y: 0, w: 6, h: 8, minW: 3, minH: 6 },
    { i: 'productivity-metrics', x: 6, y: 0, w: 6, h: 8, minW: 3, minH: 6 },
    { i: 'task-distribution', x: 0, y: 8, w: 6, h: 9, minW: 3, minH: 6 },
    { i: 'task-recommendations', x: 6, y: 8, w: 6, h: 9, minW: 3, minH: 6 },
  ],
  xs: [
    { i: 'completion-rate', x: 0, y: 0, w: 12, h: 8, minW: 3, minH: 6 },
    { i: 'productivity-metrics', x: 0, y: 8, w: 12, h: 8, minW: 3, minH: 6 },
    { i: 'task-distribution', x: 0, y: 16, w: 12, h: 9, minW: 3, minH: 6 },
    { i: 'task-recommendations', x: 0, y: 24, w: 12, h: 9, minW: 3, minH: 6 },
  ]
};

interface CustomizableDashboardProps {
  children: {
    [key: string]: React.ReactNode;
  };
}

const CustomizableDashboard: React.FC<CustomizableDashboardProps> = ({ children }) => {
  const theme = useTheme();
  // Set up state for layout management
  const [layouts, setLayouts] = useState(() => {
    try {
      const savedLayouts = localStorage.getItem('dashboardLayouts');
      if (savedLayouts && savedLayouts !== 'undefined') {
        return JSON.parse(savedLayouts);
      }
    } catch (error) {
      console.error('Failed to parse layouts from localStorage:', error);
    }
    // Return default layouts if loading fails or item doesn't exist
    return defaultLayouts;
  });
  
  // Period selection for data filtering
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>(
    localStorage.getItem('dashboardPeriod') as 'daily' | 'weekly' | 'monthly' || 'weekly'
  );
  
  // Lock/unlock dashboard editing
  const [isLocked, setIsLocked] = useState<boolean>(true);
  
  // Save layouts to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('dashboardLayouts', JSON.stringify(layouts));
  }, [layouts]);
  
  // Save period to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('dashboardPeriod', period);
  }, [period]);

  // Handle layout change
  const handleLayoutChange = (
    _currentLayout: any,
    allLayouts: any
  ) => {
    if (!isLocked) {
      setLayouts(allLayouts);
    }
  };

  // Reset to default layout
  const handleResetLayout = () => {
    setLayouts(defaultLayouts);
  };

  // Toggle lock/unlock
  const handleLockToggle = () => {
    setIsLocked(!isLocked);
  };

  // Handle period change
  const handlePeriodChange = (
    _event: React.MouseEvent<HTMLElement>,
    newPeriod: 'daily' | 'weekly' | 'monthly' | null,
  ) => {
    if (newPeriod) {
      setPeriod(newPeriod);
    }
  };

  // Map children to grid items
  const renderWidgets = () => {
    return Object.keys(children).map((key) => (
      <Box 
        key={key} 
        className={`widget ${isLocked ? 'locked' : ''}`}
        sx={{ 
          width: '100%', 
          height: '100%', 
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {children[key]}
      </Box>
    ));
  };

  return (
    <Box sx={{ mt: theme.spacing(2) }}>
      <Paper elevation={0} sx={{ p: theme.spacing(2), mb: theme.spacing(2) }}>
        <Grid container spacing={2} alignItems="center" justifyContent="space-between">
          <Grid item xs={12} sm={'auto'}>
            <Typography variant="h5" component="h1" gutterBottom={false}>
              Dashboard
            </Typography>
          </Grid>
          
          <Grid item xs={12} sm>
            <ToggleButtonGroup
              value={period}
              exclusive
              onChange={handlePeriodChange}
              aria-label="dashboard period"
              size="small"
              sx={{ width: '100%', justifyContent: 'center' }}
            >
              <ToggleButton value="daily" aria-label="daily">
                Daily
              </ToggleButton>
              <ToggleButton value="weekly" aria-label="weekly">
                Weekly
              </ToggleButton>
              <ToggleButton value="monthly" aria-label="monthly">
                Monthly
              </ToggleButton>
            </ToggleButtonGroup>
          </Grid>
          
          <Grid item xs={12} sm={'auto'} sx={{ display: 'flex', justifyContent: { xs: 'center', sm: 'flex-end' }, gap: theme.spacing(1) }}>
            <Tooltip title="Refresh Data">
              <IconButton size="small">
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            
            <Tooltip title={isLocked ? "Unlock Dashboard" : "Lock Dashboard"}>
              <IconButton 
                size="small" 
                onClick={handleLockToggle}
                color={isLocked ? "default" : "primary"}
              >
                {isLocked ? <LockIcon /> : <LockOpenIcon />}
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Reset Layout">
              <Button 
                variant="outlined" 
                size="small" 
                startIcon={<SettingsIcon />}
                onClick={handleResetLayout}
              >
                Reset
              </Button>
            </Tooltip>
          </Grid>
        </Grid>
      </Paper>
      
      <Box sx={{ mt: theme.spacing(2) }}>
        <ResponsiveGridLayout
          className="layout"
          layouts={layouts}
          breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480 }}
          cols={{ lg: 12, md: 12, sm: 12, xs: 12 }}
          rowHeight={30}
          isDraggable={!isLocked}
          isResizable={!isLocked}
          onLayoutChange={handleLayoutChange}
          compactType="vertical"
          margin={[theme.spacing(2), theme.spacing(2)]}
        >
          {renderWidgets()}
        </ResponsiveGridLayout>
      </Box>
    </Box>
  );
};

export default CustomizableDashboard; 