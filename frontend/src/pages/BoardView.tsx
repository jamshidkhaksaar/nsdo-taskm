import React, { useState } from 'react';
import { Box } from '@mui/material';
import Navbar from '../components/Navbar';

const BoardView = () => {
  const [open, setOpen] = useState(true);
  const drawerWidth = 240;

  const handleDrawerToggle = () => {
    setOpen(!open);
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <Navbar 
        open={open} 
        drawerWidth={drawerWidth} 
        onDrawerToggle={handleDrawerToggle}
      />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${open ? drawerWidth : 64}px)` },
          ml: { sm: `${open ? drawerWidth : 64}px` },
          mt: 8,
          transition: (theme) =>
            theme.transitions.create(['width', 'margin'], {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.leavingScreen,
            }),
        }}
      >
        {/* Board content */}
      </Box>
    </Box>
  );
};

export default BoardView;