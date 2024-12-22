import React from 'react';
import { Box, styled } from '@mui/material';

interface StyledBoxProps {
  open?: boolean;
  minimized?: boolean;
  notesMinimized?: boolean;
}

const LayoutRoot = styled(Box)(({ theme }) => ({
  display: 'flex',
  minHeight: '100vh',
  overflow: 'hidden',
  backgroundColor: theme.palette.background.default,
}));

const MainContent = styled(Box, {
  shouldForwardProp: prop => !['open', 'notesMinimized'].includes(prop as string),
})<StyledBoxProps>(({ theme, open, notesMinimized }) => ({
  flexGrow: 1,
  padding: theme.spacing(3),
  paddingTop: theme.spacing(10),
  marginLeft: open 
    ? (notesMinimized ? '240px' : '520px') // 240px (sidebar) + 280px (notes) when expanded
    : (notesMinimized ? '72px' : '352px'),  // 72px (mini sidebar) + 280px (notes) when expanded
  marginRight: 0,
  marginBottom: '48px',
  transition: theme.transitions.create(['margin'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),
  [theme.breakpoints.down('sm')]: {
    marginLeft: 0,
    marginRight: 0,
    width: '100%',
    padding: theme.spacing(2),
  },
}));

const SidebarWrapper = styled(Box, {
  shouldForwardProp: prop => prop !== 'open',
})<StyledBoxProps>(({ theme, open }) => ({
  position: 'fixed',
  top: 0,
  left: 0,
  bottom: 0,
  width: open ? 240 : 72,
  backgroundColor: theme.palette.background.paper,
  borderRight: `1px solid ${theme.palette.divider}`,
  zIndex: theme.zIndex.drawer,
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),
  [theme.breakpoints.down('sm')]: {
    width: open ? 240 : 0,
  },
}));

const QuickNotesWrapper = styled(Box, {
  shouldForwardProp: prop => !['minimized', 'open'].includes(prop as string),
})<StyledBoxProps>(({ theme, minimized, open }) => ({
  position: 'fixed',
  top: minimized ? 'auto' : 72,
  bottom: 0,
  left: open ? 240 : 72,
  width: 280,
  height: minimized ? 48 : 'auto',
  backgroundColor: theme.palette.background.paper,
  borderRight: `1px solid ${theme.palette.divider}`,
  zIndex: theme.zIndex.drawer - 1,
  transition: theme.transitions.create(['left', 'top', 'height'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),
  [theme.breakpoints.down('sm')]: {
    width: '100%',
    left: 0,
    borderRight: 'none',
  },
}));

const FooterWrapper = styled(Box, {
  shouldForwardProp: prop => !['open', 'notesMinimized'].includes(prop as string),
})<StyledBoxProps>(({ theme, open, notesMinimized }) => ({
  position: 'fixed',
  display: 'flex',
  alignItems: 'center',
  bottom: 0,
  left: open 
    ? (notesMinimized ? '520px' : '520px') // Always start after QuickNotes (240px + 280px)
    : (notesMinimized ? '352px' : '352px'),  // Always start after QuickNotes (72px + 280px)
  right: 0,
  height: 47,
  padding: theme.spacing(0, 2),
  backgroundColor: theme.palette.background.paper,
  borderTop: `1px solid ${theme.palette.divider}`,
  borderTopLeftRadius: theme.shape.borderRadius * 2,
  borderTopRightRadius: theme.shape.borderRadius * 2,
  zIndex: theme.zIndex.drawer - 2,
  overflow: 'hidden',
  '& > *': {
    minWidth: 0,
    flex: '1 1 auto',
  },
  transition: theme.transitions.create(['left'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),
  [theme.breakpoints.down('sm')]: {
    left: 0,
    width: '100%',
    padding: theme.spacing(0, 1),
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
  },
}));

interface DashboardLayoutProps {
  children: React.ReactNode;
  sidebar: React.ReactNode;
  quickNotes: React.ReactNode;
  footer: React.ReactNode;
  isOpen: boolean;
  isNotesMinimized: boolean;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  sidebar,
  quickNotes,
  footer,
  isOpen,
  isNotesMinimized,
}) => {
  return (
    <LayoutRoot>
      <SidebarWrapper open={isOpen}>
        {sidebar}
      </SidebarWrapper>

      <QuickNotesWrapper minimized={isNotesMinimized} open={isOpen}>
        {quickNotes}
      </QuickNotesWrapper>

      <MainContent open={isOpen} notesMinimized={isNotesMinimized}>
        {children}
      </MainContent>

      <FooterWrapper open={isOpen} notesMinimized={isNotesMinimized}>
        {footer}
      </FooterWrapper>
    </LayoutRoot>
  );
};

export default DashboardLayout; 