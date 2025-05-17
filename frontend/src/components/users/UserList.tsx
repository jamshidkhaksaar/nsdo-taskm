import React from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Typography,
  Divider,
  TextField,
  InputAdornment,
  Avatar,
  Checkbox,
  FormControlLabel
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { User } from '../../types/user';

interface UserListProps {
  users: User[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedUserIds: string[];
  onSelectedUsersChange: (ids: string[]) => void;
  title?: string;
}

const UserList: React.FC<UserListProps> = ({
  users,
  searchQuery,
  onSearchChange,
  selectedUserIds,
  onSelectedUsersChange,
  title = "Users List"
}) => {
  const handleToggleAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      const allUserIds = users.map(user => user.id.toString());
      onSelectedUsersChange(allUserIds);
    } else {
      onSelectedUsersChange([]);
    }
  };

  const handleUserToggle = (userId: string) => {
    const currentIndex = selectedUserIds.indexOf(userId);
    const newSelectedUserIds = [...selectedUserIds];

    if (currentIndex === -1) {
      newSelectedUserIds.push(userId);
    } else {
      newSelectedUserIds.splice(currentIndex, 1);
    }
    onSelectedUsersChange(newSelectedUserIds);
  };

  const isAllSelected = users.length > 0 && selectedUserIds.length === users.length;
  const isIndeterminate = selectedUserIds.length > 0 && selectedUserIds.length < users.length;

  const getUserDisplayPrimary = (user: User) => {
    if (user.first_name && user.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    return user.username;
  };

  const getUserDisplaySecondary = (user: User) => {
    let secondary = user.role?.name || 'No role';
    if (!(user.first_name && user.last_name) && user.email) {
      secondary += ` - ${user.email}`;
    }
    return secondary;
  };

  return (
    <Box
      sx={{
        background: 'rgba(40, 40, 60, 0.7)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: 3,
        p: 3,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 8px 32px 0 rgba( 31, 38, 135, 0.37 )'
      }}
    >
      <Typography variant="h5" sx={{ color: '#e0e0e0', mb: 2, fontWeight: 'bold' }}> 
        {title}
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
            color: '#e0e0e0',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            '& fieldset': {
              borderColor: 'rgba(255, 255, 255, 0.3)',
            },
            '&:hover fieldset': {
              borderColor: 'rgba(255, 255, 255, 0.5)',
            },
            '&.Mui-focused fieldset': {
              borderColor: 'rgba(100, 180, 255, 0.7)',
            },
          },
          '& .MuiInputLabel-root': {
            color: 'rgba(255, 255, 255, 0.6)',
          },
           '& .MuiInputBase-input::placeholder': {
            color: 'rgba(200, 200, 200, 0.7)',
            opacity: 1, 
          },
        }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon sx={{ color: 'rgba(255, 255, 255, 0.6)' }} />
            </InputAdornment>
          ),
        }}
      />
      
      <FormControlLabel
        control={
          <Checkbox
            checked={isAllSelected}
            indeterminate={isIndeterminate}
            onChange={handleToggleAll}
            sx={{ color: 'rgba(255, 255, 255, 0.7)', '&.Mui-checked': { color: '#64b5f6' } }}
          />
        }
        label={isAllSelected ? "Deselect All" : "Select All"}
        sx={{ color: 'rgba(255, 255, 255, 0.8)', mb: 1, ml: 0.5 }}
      />
      
      <Divider sx={{ backgroundColor: 'rgba(255, 255, 255, 0.15)', mb: 2 }} />
      
      {users.length === 0 && searchQuery && (
        <Typography sx={{color: 'rgba(255,255,255,0.7)', textAlign: 'center', mt: 2}}>
          No users match "{searchQuery}".
        </Typography>
      )}
      {users.length === 0 && !searchQuery && (
         <Typography sx={{color: 'rgba(255,255,255,0.7)', textAlign: 'center', mt: 2}}>
          No users available.
        </Typography>
      )}

      <List sx={{ flexGrow: 1, overflow: 'auto', 
        '&::-webkit-scrollbar': { width: '8px' },
        '&::-webkit-scrollbar-track': { background: 'rgba(255,255,255,0.05)' },
        '&::-webkit-scrollbar-thumb': { background: 'rgba(255,255,255,0.2)', borderRadius: '4px' },
        '&::-webkit-scrollbar-thumb:hover': { background: 'rgba(255,255,255,0.3)' }
      }}>
        {users.map((user) => {
          const isSelected = selectedUserIds.includes(user.id.toString());
          return (
            <ListItem
              key={user.id}
              button
              onClick={() => handleUserToggle(user.id.toString())}
              selected={isSelected}
              sx={{
                borderRadius: 1.5,
                mb: 1,
                backgroundColor: isSelected ? 'rgba(100, 180, 255, 0.2)' : 'transparent',
                '&:hover': {
                  backgroundColor: isSelected ? 'rgba(100, 180, 255, 0.3)' : 'rgba(255, 255, 255, 0.08)',
                },
              }}
            >
              <Checkbox
                  edge="start"
                  checked={isSelected}
                  tabIndex={-1}
                  disableRipple
                  inputProps={{ 'aria-labelledby': `user-list-item-label-${user.id}` }}
                  sx={{ mr: 1.5, color: 'rgba(255, 255, 255, 0.7)', '&.Mui-checked': { color: '#64b5f6' } }}
                />
              <ListItemAvatar>
                <Avatar src={user.avatar} alt={user.username} sx={{backgroundColor: 'primary.main'}}>
                  {user.first_name ? user.first_name.charAt(0).toUpperCase() : user.username.charAt(0).toUpperCase()}
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                id={`user-list-item-label-${user.id}`}
                primary={getUserDisplayPrimary(user)}
                secondary={getUserDisplaySecondary(user)}
                sx={{
                  '& .MuiListItemText-primary': {
                    color: '#f0f0f0',
                    fontWeight: 500,
                  },
                  '& .MuiListItemText-secondary': {
                    color: 'rgba(220, 220, 220, 0.7)',
                  },
                }}
              />
            </ListItem>
          );
        })}
      </List>
    </Box>
  );
};

export default UserList; 