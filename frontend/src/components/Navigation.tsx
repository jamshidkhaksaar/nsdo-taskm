import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ListItemIcon, MenuItem } from '@mui/material';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';

const Navigation = () => {
  const navigate = useNavigate();
  
  const handleProfileClick = () => {
    navigate('/profile');
  };

  return (
    <MenuItem onClick={() => navigate('/profile')}>
      <ListItemIcon>
        <AccountCircleIcon sx={{ color: '#fff' }} />
      </ListItemIcon>
      Profile
    </MenuItem>
  );
};

export default Navigation; 