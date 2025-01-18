import React from 'react';
import { Avatar, AvatarGroup, Tooltip } from '@mui/material';
import { User } from '../../types/user';

const stringToColor = (string: string): string => {
  let hash = 0;
  for (let i = 0; i < string.length; i++) {
    hash = string.charCodeAt(i) + ((hash << 5) - hash);
  }
  let color = '#';
  for (let i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 0xFF;
    color += `00${value.toString(16)}`.slice(-2);
  }
  return color;
};

interface CollaboratorAvatarsProps {
  collaborators: User[];
}

export const CollaboratorAvatars: React.FC<CollaboratorAvatarsProps> = ({ collaborators }) => {
  return (
    <AvatarGroup
      max={3}
      spacing="medium"
      sx={{
        display: 'flex',
        alignItems: 'center',
        '& .MuiAvatar-root': {
          width: 28,
          height: 28,
          fontSize: '0.875rem',
          border: '2px solid rgba(255, 255, 255, 0.2)',
          marginLeft: '-8px',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          color: '#fff',
          '&:first-of-type': {
            marginLeft: 0,
          },
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
            zIndex: 2,
          }
        }
      }}
    >
      {collaborators.map((user) => (
        <Tooltip 
          key={user.id} 
          title={`${user.first_name} ${user.last_name}`}
          arrow
          placement="top"
        >
          <Avatar
            sx={{
              bgcolor: stringToColor(user.username || user.first_name),
            }}
          >
            {(user.first_name?.[0] || user.username?.[0] || '?').toUpperCase()}
          </Avatar>
        </Tooltip>
      ))}
    </AvatarGroup>
  );
}; 