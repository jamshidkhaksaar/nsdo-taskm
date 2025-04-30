import React, { ReactNode } from 'react';
import { Box, useTheme, useMediaQuery } from '@mui/material';
import { standardBackgroundStyle } from '../../utils/backgroundStyles';

interface ModernDashboardLayoutProps {
  sidebar: ReactNode;
  topBar: ReactNode;
  mainContent: ReactNode;
  rightPanel?: ReactNode;
  footer?: ReactNode;
  sidebarOpen: boolean;
  drawerWidth: number;
  disableMainContentScroll?: boolean;
  quickNotesPanel?: ReactNode;
  quickNotesVisible?: boolean;
}

const DRAWER_WIDTH = 240;

const ModernDashboardLayout: React.FC<ModernDashboardLayoutProps> = ({
  sidebar,
  topBar,
  mainContent,
  rightPanel,
  footer,
  sidebarOpen,
  drawerWidth = DRAWER_WIDTH,
  disableMainContentScroll = false,
  quickNotesPanel,
  quickNotesVisible = false
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Calculate the correct left margin based on sidebar state
  const sidebarWidth = sidebarOpen ? drawerWidth : (isMobile ? 0 : 65);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'row',
        height: '100vh',
        width: '100%',
        overflow: 'hidden',
        ...standardBackgroundStyle,
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h40v40H0z' fill='none'/%3E%3Ccircle cx='20' cy='20' r='1' fill='rgba(255,255,255,0.1)'/%3E%3Cpath d='M0 20h40M20 0v40' stroke='rgba(255,255,255,0.05)' stroke-width='0.5'/%3E%3C/svg%3E")`,
          backgroundSize: '40px 40px',
          opacity: 0.3,
          pointerEvents: 'none',
          zIndex: 0,
        },
      }}
    >
      {/* Sidebar - fixed position */}
      <Box
        sx={{
          width: sidebarWidth,
          transition: theme.transitions.create(['width'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
          overflow: 'hidden',
          flexShrink: 0,
        }}
      >
        {sidebar}
      </Box>

      {/* Main content area */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          flexGrow: 1,
          width: `calc(100% - ${sidebarWidth}px)`,
          transition: theme.transitions.create(['width'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
          height: '100vh',
          overflow: 'hidden',
          zIndex: 1, // Ensure content is above the background pattern
        }}
      >
        {/* Top Bar */}
        <Box
          sx={{
            position: 'sticky',
            top: 0,
            zIndex: 10,
            height: '64px', // Fixed height for topBar
            flexShrink: 0,
          }}
        >
          {topBar}
        </Box>

        {/* Content area with optional right panel */}
        <Box
          sx={{
            display: 'flex',
            flexGrow: 1,
            overflow: 'hidden',
            height: { 
              xs: 'calc(100vh - 64px - 40px)', // Mobile/tablet view
              md: 'calc(100vh - 64px - 40px)'  // Desktop view
            },
          }}
        >
          {/* Main scrollable content */}
          <Box
            sx={{
              flexGrow: 1,
              height: '100%',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
            }}
          >
            <Box
              sx={{
                flexGrow: 1,
                overflowY: disableMainContentScroll ? 'hidden' : 'auto',
                overflowX: 'hidden',
                height: '100%',
                padding: { xs: 1, sm: 2 },
                '&::-webkit-scrollbar': {
                  width: '8px',
                },
                '&::-webkit-scrollbar-track': {
                  background: 'rgba(0,0,0,0.05)',
                },
                '&::-webkit-scrollbar-thumb': {
                  background: 'rgba(255,255,255,0.1)',
                  borderRadius: '4px',
                  '&:hover': {
                    background: 'rgba(255,255,255,0.2)',
                  },
                },
              }}
            >
              {mainContent}
            </Box>
          </Box>

          {/* Right panel - Conditionally render Quick Notes */}
          {quickNotesVisible && quickNotesPanel && (
            <Box
              sx={{
                width: '280px', // Fixed width for the notes panel
                flexShrink: 0,
                backgroundColor: 'rgba(10, 25, 41, 0.7)', // Slightly different background
                backdropFilter: 'blur(5px)',
                overflowY: 'auto',
                display: { xs: 'none', md: 'block' },
                borderLeft: '1px solid rgba(255, 255, 255, 0.08)',
                transition: theme.transitions.create(['width', 'margin'], {
                  easing: theme.transitions.easing.sharp,
                  duration: theme.transitions.duration.enteringScreen,
                }),

                '&::-webkit-scrollbar': {
                  width: '6px',
                },
                '&::-webkit-scrollbar-track': {
                  background: 'rgba(0,0,0,0.05)',
                },
                '&::-webkit-scrollbar-thumb': {
                  background: 'rgba(255,255,255,0.1)',
                  borderRadius: '4px',
                  '&:hover': {
                    background: 'rgba(255,255,255,0.2)',
                  },
                },
              }}
            >
              {/* Render the actual quick notes panel passed as a prop */}
              {quickNotesPanel}
            </Box>
          )}
        </Box>

        {/* Footer - only render if provided */}
        {footer && (
          <Box
            sx={{
              height: '40px',
              flexShrink: 0,
              borderTop: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(0, 0, 0, 0.1)',
              width: '100%',
            }}
          >
            {footer}
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default ModernDashboardLayout; 