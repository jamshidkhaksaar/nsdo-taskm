import { Card, CardContent, Typography, Box, Avatar, Chip } from '@mui/material';
import { User } from '../../types/user';
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';

interface UserCardProps {
  user: User;
  isSelected?: boolean;
  onClick?: () => void;
}

const UserCard: React.FC<UserCardProps> = ({ 
  user, 
  isSelected = false,
  onClick
}) => {
  // Function to determine role color
  const getRoleColor = (role?: string) => {
    switch (role) {
      case 'admin':
        return '#f44336'; // Red
      case 'leadership':
        return '#ff9800'; // Orange
      case 'team_lead':
        return '#2196f3'; // Blue
      default:
        return '#4caf50'; // Green for regular users
    }
  };

  return (
    <Card 
      sx={{ 
        mb: 2, 
        cursor: 'pointer',
        background: isSelected 
          ? 'linear-gradient(to right, rgba(25, 118, 210, 0.1), rgba(25, 118, 210, 0.3))' 
          : 'rgba(17, 25, 40, 0.8)',
        borderLeft: isSelected ? '4px solid #1976d2' : '4px solid transparent',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          background: 'linear-gradient(to right, rgba(25, 118, 210, 0.1), rgba(25, 118, 210, 0.2))',
        }
      }}
      onClick={onClick}
    >
      <CardContent>
        <Box display="flex" alignItems="center" gap={2}>
          <Avatar 
            src={user.avatar} 
            alt={`${user.first_name} ${user.last_name}`}
            sx={{ width: 40, height: 40 }}
          >
            {user.first_name ? user.first_name.charAt(0) : '?'}
          </Avatar>
          
          <Box>
            <Typography variant="body1" component="div" sx={{ color: '#fff', fontWeight: 'bold' }}>
              {user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : user.username}
            </Typography>
            
            <Box display="flex" alignItems="center" gap={1}>
              <EmailIcon fontSize="small" sx={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.8rem' }} />
              <Typography variant="caption" color="rgba(255, 255, 255, 0.7)">
                {user.email}
              </Typography>
            </Box>
          </Box>
        </Box>
        
        <Box display="flex" gap={1} mt={1} justifyContent="flex-end">
          {user.role && (
            <Chip
              icon={<PersonIcon fontSize="small" />}
              label={user.role}
              size="small"
              sx={{ 
                bgcolor: getRoleColor(user.role), 
                color: '#fff',
                fontSize: '0.7rem',
                height: 24
              }}
            />
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default UserCard; 