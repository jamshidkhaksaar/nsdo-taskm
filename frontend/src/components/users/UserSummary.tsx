import {
  Box,
  Card,
  CardContent,
  Typography,
  Avatar,
  LinearProgress,
  Grid,
  SxProps,
} from '@mui/material';

interface UserSummaryProps {
  user: {
    username: string;
    first_name?: string;
    last_name?: string;
    role: string;
    avatar?: string;
    totalTasks: number;
    completedTasks: number;
    ongoingTasks: number;
    completionRate: number;
    sx?: {
      completionRate?: React.CSSProperties;
      progressBar?: SxProps;
    };
  } | null;
}

const UserSummary: React.FC<UserSummaryProps> = ({ user }) => {
  if (!user) {
    return null;
  }

  const displayName = user.first_name && user.last_name 
    ? `${user.first_name} ${user.last_name}` 
    : user.username;

  return (
    <Card
      sx={{
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(8px)',
        border: '1px solid rgba(255, 255, 255, 0.18)',
        borderRadius: 2,
        mb: 3,
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <Avatar
            src={user.avatar}
            alt={displayName}
            sx={{ width: 64, height: 64 }}
          >
            {user.first_name ? user.first_name.charAt(0) : user.username.charAt(0)}
          </Avatar>
          <Box>
            <Typography variant="h5" sx={{ color: '#fff' }}>
              {displayName}
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
              {user.role}
            </Typography>
          </Box>
        </Box>

        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={6}>
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" sx={{ color: '#fff' }}>
                  Task Completion Rate
                </Typography>
                <Typography 
                  variant="h4" 
                  sx={{ 
                    color: '#fff',
                    ...user.sx?.completionRate 
                  }}
                >
                  {user.completionRate}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={user.completionRate}
                sx={{
                  width: '100%',
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: '#4CAF50',
                  },
                  ...user.sx?.progressBar,
                }}
              />
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', justifyContent: 'space-around' }}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6" sx={{ color: '#ff3d00' }}>
                  {user.ongoingTasks}
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                  Ongoing Tasks
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6" sx={{ color: '#4CAF50' }}>
                  {user.completedTasks}
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                  Completed Tasks
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6" sx={{ color: '#2196F3' }}>
                  {user.totalTasks}
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                  Total Tasks
                </Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default UserSummary; 