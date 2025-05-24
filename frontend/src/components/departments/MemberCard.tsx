import React from 'react';
import {
  Card,
  CardContent,
  Avatar,
  Typography,
  Box,
  Chip,
  IconButton,
  Tooltip,
  Skeleton,
  useTheme,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import PersonIcon from '@mui/icons-material/Person';
import WorkIcon from '@mui/icons-material/Work';
import TaskIcon from '@mui/icons-material/Task';
import PendingIcon from '@mui/icons-material/Schedule';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import { useQuery } from '@tanstack/react-query';
import { TaskService } from '@/services/task';

interface MemberCardProps {
  member: {
    id: string;
    username?: string;
    first_name?: string;
    last_name?: string;
    avatar?: string;
    position?: string;
    role?: {
      id: string;
      name: string;
    };
  };
  onRemove?: (memberId: string) => void;
  canRemove?: boolean;
}

const MemberCard: React.FC<MemberCardProps> = ({
  member,
  onRemove,
  canRemove = true,
}) => {
  const theme = useTheme();

  // Get task counts for the member
  const {
    data: taskCounts,
    isLoading: isLoadingTasks,
  } = useQuery({
    queryKey: ['userTaskCounts', member.id],
    queryFn: () => TaskService.getTaskCountsByStatusForUser(member.id),
    enabled: !!member.id,
    staleTime: 30 * 1000, // Cache for 30 seconds
  });

  // Prepare display name
  const firstName = member.first_name || '';
  const lastName = member.last_name || '';
  const fullName = `${firstName} ${lastName}`.trim();
  const displayName = fullName || member.username || 'Unknown User';

  // Prepare position display
  const position = member.position || member.role?.name || 'No Position';

  // Calculate task counts
  const pendingTasks = taskCounts?.pending || 0;
  const ongoingTasks = taskCounts?.in_progress || 0;
  const totalTasks = pendingTasks + ongoingTasks + (taskCounts?.completed || 0) + (taskCounts?.cancelled || 0);

  // Get avatar initials
  const getInitials = (name: string) => {
    const words = name.split(' ').filter(word => word.length > 0);
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    } else if (words.length === 1) {
      return words[0][0]?.toUpperCase() || '?';
    }
    return '?';
  };

  const cardStyles = {
    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.04) 100%)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    borderRadius: '16px',
    transition: 'all 0.3s ease',
    '&:hover': {
      transform: 'translateY(-4px)',
      boxShadow: '0 12px 40px rgba(0, 0, 0, 0.3)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
    },
  };

  return (
    <Card sx={cardStyles}>
      <CardContent sx={{ p: 3, position: 'relative' }}>
        {/* Remove button */}
        {canRemove && onRemove && (
          <Tooltip title="Remove member">
            <IconButton
              size="small"
              onClick={() => onRemove(member.id)}
              sx={{
                position: 'absolute',
                top: 8,
                right: 8,
                color: 'rgba(255, 255, 255, 0.6)',
                '&:hover': {
                  color: '#ff4444',
                  backgroundColor: 'rgba(255, 68, 68, 0.1)',
                },
              }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}

        {/* Avatar and basic info */}
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2 }}>
          <Avatar
            src={member.avatar}
            sx={{
              width: 64,
              height: 64,
              mb: 1.5,
              bgcolor: theme.palette.primary.main,
              fontSize: '1.5rem',
              fontWeight: 'bold',
              border: '3px solid rgba(255, 255, 255, 0.2)',
            }}
          >
            {member.avatar ? null : getInitials(displayName)}
          </Avatar>

          <Typography
            variant="h6"
            sx={{
              color: '#fff',
              fontWeight: 600,
              textAlign: 'center',
              mb: 0.5,
              lineHeight: 1.2,
            }}
          >
            {displayName}
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <WorkIcon sx={{ color: 'rgba(255, 255, 255, 0.6)', mr: 0.5, fontSize: '1rem' }} />
            <Typography
              variant="body2"
              sx={{
                color: 'rgba(255, 255, 255, 0.8)',
                textAlign: 'center',
                fontStyle: position === 'No Position' ? 'italic' : 'normal',
              }}
            >
              {position}
            </Typography>
          </Box>
        </Box>

        {/* Task statistics */}
        <Box sx={{ mt: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
            <TaskIcon sx={{ color: 'rgba(255, 255, 255, 0.6)', mr: 0.5, fontSize: '1rem' }} />
            <Typography
              variant="caption"
              sx={{ color: 'rgba(255, 255, 255, 0.8)', fontWeight: 600 }}
            >
              Task Summary
            </Typography>
          </Box>

          {isLoadingTasks ? (
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Skeleton variant="rounded" width={60} height={24} />
              <Skeleton variant="rounded" width={60} height={24} />
            </Box>
          ) : (
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'center' }}>
              <Tooltip title={`${pendingTasks} pending tasks`}>
                <Chip
                  icon={<PendingIcon sx={{ fontSize: '14px !important' }} />}
                  label={`${pendingTasks} Pending`}
                  size="small"
                  sx={{
                    backgroundColor: 'rgba(255, 193, 7, 0.2)',
                    color: '#ffc107',
                    border: '1px solid rgba(255, 193, 7, 0.3)',
                    fontSize: '0.7rem',
                    '& .MuiChip-icon': {
                      color: '#ffc107',
                    },
                  }}
                />
              </Tooltip>

              <Tooltip title={`${ongoingTasks} ongoing tasks`}>
                <Chip
                  icon={<PlayCircleOutlineIcon sx={{ fontSize: '14px !important' }} />}
                  label={`${ongoingTasks} Ongoing`}
                  size="small"
                  sx={{
                    backgroundColor: 'rgba(33, 150, 243, 0.2)',
                    color: '#2196f3',
                    border: '1px solid rgba(33, 150, 243, 0.3)',
                    fontSize: '0.7rem',
                    '& .MuiChip-icon': {
                      color: '#2196f3',
                    },
                  }}
                />
              </Tooltip>
            </Box>
          )}

          {!isLoadingTasks && (
            <Typography
              variant="caption"
              sx={{
                color: 'rgba(255, 255, 255, 0.6)',
                textAlign: 'center',
                display: 'block',
                mt: 1,
                fontStyle: 'italic',
              }}
            >
              Total: {totalTasks} tasks
            </Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default MemberCard; 