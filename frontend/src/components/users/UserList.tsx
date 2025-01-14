import React from 'react';
import {
  Box,
  List,
  ListItemButton,
  ListItemText,
  ListItemAvatar,
  Typography,
  Divider,
  TextField,
  InputAdornment,
  Avatar,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  role: string;
  first_name?: string;
  last_name?: string;
  department?: string;
}

interface UserListProps {
  users: User[];
  selectedUser: string | null;
  onSelectUser: (id: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

const UserList: React.FC<UserListProps> = ({
  users,
  selectedUser,
  onSelectUser,
  searchQuery,
  onSearchChange,
}) => {
  return (
    <Box
      sx={{
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(8px)',
        border: '1px solid rgba(255, 255, 255, 0.18)',
        borderRadius: 2,
        p: 2,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Typography variant="h6" sx={{ color: '#fff', mb: 2 }}>
        Users List
      </Typography>
      
      <TextField
        fullWidth
        variant="outlined"
        placeholder="Search users..."
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        sx={{
          mb: 2,
          '& .MuiOutlinedInput-root': {
            color: '#fff',
            '& fieldset': {
              borderColor: 'rgba(255, 255, 255, 0.23)',
            },
            '&:hover fieldset': {
              borderColor: 'rgba(255, 255, 255, 0.4)',
            },
            '&.Mui-focused fieldset': {
              borderColor: 'rgba(255, 255, 255, 0.5)',
            },
          },
          '& .MuiInputLabel-root': {
            color: 'rgba(255, 255, 255, 0.7)',
          },
        }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon sx={{ color: 'rgba(255, 255, 255, 0.7)' }} />
            </InputAdornment>
          ),
        }}
      />
      
      <Divider sx={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', mb: 2 }} />
      
      <List sx={{ flexGrow: 1, overflow: 'auto' }}>
        {users.map((user) => (
          <ListItemButton
            key={user.id}
            selected={selectedUser === user.id}
            onClick={() => onSelectUser(user.id)}
            sx={{
              borderRadius: 1,
              mb: 1,
              '&.Mui-selected': {
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.25)',
                },
              },
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
              },
            }}
          >
            <ListItemAvatar>
              <Avatar src={user.avatar} alt={user.username}>
                {user.first_name ? user.first_name.charAt(0) : user.username.charAt(0)}
              </Avatar>
            </ListItemAvatar>
            <ListItemText
              primary={user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : user.username}
              secondary={
                <Box component="span" sx={{ display: 'block' }}>
                  <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                    {user.role}
                  </Typography>
                </Box>
              }
              sx={{
                '& .MuiListItemText-primary': {
                  color: '#fff',
                },
              }}
            />
          </ListItemButton>
        ))}
      </List>
    </Box>
  );
};

export default UserList; 