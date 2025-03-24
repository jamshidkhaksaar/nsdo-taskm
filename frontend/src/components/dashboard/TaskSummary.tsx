import React, { useMemo } from 'react';
import { Box, Typography, Stack, Divider } from '@mui/material';
import PendingIcon from '@mui/icons-material/Pending';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import { Task } from '../../types/task';

interface TaskSummaryProps {
  tasks: Task[];
  compact?: boolean;  // Added compact prop
}

const TaskSummary: React.FC<TaskSummaryProps> = ({ tasks, compact = false }) => {
  // Memoize task counts to prevent unnecessary recalculations
  const {
    totalCount,
    pendingCount,
    inProgressCount,
    completedCount,
    cancelledCount
  } = useMemo(() => {
    return {
      totalCount: tasks.length,
      pendingCount: tasks.filter(task => task.status === 'pending').length,
      inProgressCount: tasks.filter(task => task.status === 'in_progress').length,
      completedCount: tasks.filter(task => task.status === 'completed').length,
      cancelledCount: tasks.filter(task => task.status === 'cancelled').length
    };
  }, [tasks]);

  // Enhanced compact horizontal layout
  return (
    <Box 
      sx={{ 
        width: '100%', 
        mb: { xs: 1.5, sm: 1 },
        backgroundColor: 'rgba(30, 41, 59, 0.8)',
        borderRadius: '8px',
        overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        border: 'none',
        p: { xs: 1.25, sm: 1.5 },
        height: compact ? 'auto' : '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Stack 
        direction={{ xs: 'column', sm: 'row' }} 
        spacing={compact ? 1.5 : 2}
        divider={<Divider orientation="vertical" flexItem sx={{ bgcolor: 'rgba(255,255,255,0.15)' }} />}
        alignItems="center"
        justifyContent="space-between"
        flexWrap="wrap"
        sx={{ 
          width: '100%',
          py: compact ? 0.5 : 1,
        }}
      >
        <Box sx={{ 
          minWidth: 120, 
          width: { xs: '100%', sm: 'auto' }, 
          mb: { xs: 1, sm: 0 },
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <Typography 
            variant="subtitle1" 
            sx={{ 
              color: '#fff', 
              fontWeight: 600,
              fontSize: { xs: '0.9rem', sm: '1rem' },
              letterSpacing: '0.01em',
              mb: 0.5,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              textAlign: 'center'
            }}
          >
            Task Summary
          </Typography>
          <Box 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 0.5,
              bgcolor: 'rgba(255, 255, 255, 0.08)',
              borderRadius: '12px',
              px: 1,
              py: 0.25,
              width: 'fit-content',
              mx: 'auto'
            }}
          >
            <Typography 
              variant="caption" 
              sx={{ 
                color: 'rgba(255, 255, 255, 0.8)',
                fontWeight: 500,
                fontSize: { xs: '0.75rem', sm: '0.8rem' },
                letterSpacing: '0.01em',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              {totalCount} total tasks
            </Typography>
          </Box>
        </Box>
        
        <Stack 
          direction="row" 
          spacing={{ xs: 2, sm: 3 }}
          divider={<Divider orientation="vertical" flexItem sx={{ bgcolor: 'rgba(255,255,255,0.15)' }} />} 
          flexWrap="wrap" 
          justifyContent="space-evenly"
          alignItems="center"
          sx={{ 
            overflow: 'visible',
            px: 2,
            py: 0.75,
            height: '100%',
            display: 'flex'
          }}
        >
          {/* Pending */}
          <Stack 
            direction="row" 
            alignItems="center" 
            spacing={1} 
            sx={{ 
              py: 0.75, 
              px: 1, 
              borderRadius: 1,
              // Removed hover effect to match WeatherWidget
            }}
          >
            <Box 
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                width: 24, 
                height: 24, 
                borderRadius: '50%', 
                bgcolor: 'rgba(243, 156, 18, 0.15)' 
              }}
            >
              <PendingIcon sx={{ color: '#f39c12', fontSize: 16 }} />
            </Box>
            <Stack>
              <Typography 
                variant="body2" 
                sx={{ 
                  color: '#fff', 
                  fontWeight: 600,
                  fontSize: { xs: '0.9rem', sm: '1rem' },
                  letterSpacing: '0.01em',
                  lineHeight: 1.2 
                }}
              >
                {pendingCount}
              </Typography>
              <Typography 
                variant="caption" 
                sx={{ 
                  color: 'rgba(255, 255, 255, 0.85)',
                  fontWeight: 500,
                  fontSize: { xs: '0.75rem', sm: '0.8rem' },
                  letterSpacing: '0.01em',
                  lineHeight: 1,
                  whiteSpace: 'nowrap',
                  overflow: 'visible',
                  textOverflow: 'clip',
                  minWidth: { xs: '70px', sm: '80px' },
                  textAlign: 'center'
                }}
              >
                Pending
              </Typography>
            </Stack>
          </Stack>
          
          {/* In Progress */}
          <Stack 
            direction="row" 
            alignItems="center" 
            spacing={1} 
            sx={{ 
              py: 0.75, 
              px: 1, 
              borderRadius: 1,
              // Removed hover effect to match WeatherWidget
            }}
          >
            <Box 
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                width: 24, 
                height: 24, 
                borderRadius: '50%', 
                bgcolor: 'rgba(155, 89, 182, 0.15)' 
              }}
            >
              <AccessTimeIcon sx={{ color: '#9b59b6', fontSize: 16 }} />
            </Box>
            <Stack>
              <Typography 
                variant="body2" 
                sx={{ 
                  color: '#fff', 
                  fontWeight: 600,
                  fontSize: { xs: '0.9rem', sm: '1rem' },
                  letterSpacing: '0.01em',
                  lineHeight: 1.2 
                }}
              >
                {inProgressCount}
              </Typography>
              <Typography 
                variant="caption" 
                sx={{ 
                  color: 'rgba(255, 255, 255, 0.85)',
                  fontWeight: 500,
                  fontSize: { xs: '0.75rem', sm: '0.8rem' },
                  letterSpacing: '0.01em',
                  lineHeight: 1,
                  whiteSpace: 'nowrap',
                  overflow: 'visible',
                  textOverflow: 'clip',
                  minWidth: { xs: '60px', sm: '70px' },
                  textAlign: 'center'
                }}
              >
                In Progress
              </Typography>
            </Stack>
          </Stack>
          
          {/* Completed */}
          <Stack 
            direction="row" 
            alignItems="center" 
            spacing={1} 
            sx={{ 
              py: 0.75, 
              px: 1, 
              borderRadius: 1,
              // Removed hover effect to match WeatherWidget
            }}
          >
            <Box 
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                width: 24, 
                height: 24, 
                borderRadius: '50%', 
                bgcolor: 'rgba(46, 204, 113, 0.15)' 
              }}
            >
              <CheckCircleIcon sx={{ color: '#2ecc71', fontSize: 16 }} />
            </Box>
            <Stack>
              <Typography 
                variant="body2" 
                sx={{ 
                  color: '#fff', 
                  fontWeight: 600,
                  fontSize: { xs: '0.9rem', sm: '1rem' },
                  letterSpacing: '0.01em',
                  lineHeight: 1.2 
                }}
              >
                {completedCount}
              </Typography>
              <Typography 
                variant="caption" 
                sx={{ 
                  color: 'rgba(255, 255, 255, 0.85)',
                  fontWeight: 500,
                  fontSize: { xs: '0.75rem', sm: '0.8rem' },
                  letterSpacing: '0.01em',
                  lineHeight: 1,
                  whiteSpace: 'nowrap',
                  overflow: 'visible',
                  textOverflow: 'clip',
                  minWidth: { xs: '60px', sm: '70px' },
                  textAlign: 'center'
                }}
              >
                Completed
              </Typography>
            </Stack>
          </Stack>
          
          {/* Cancelled */}
          <Stack 
            direction="row" 
            alignItems="center" 
            spacing={1} 
            sx={{ 
              py: 0.75, 
              px: 1, 
              borderRadius: 1,
              // Removed hover effect to match WeatherWidget
            }}
          >
            <Box 
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                width: 24, 
                height: 24, 
                borderRadius: '50%', 
                bgcolor: 'rgba(231, 76, 60, 0.15)' 
              }}
            >
              <CancelIcon sx={{ color: '#e74c3c', fontSize: 16 }} />
            </Box>
            <Stack>
              <Typography 
                variant="body2" 
                sx={{ 
                  color: '#fff', 
                  fontWeight: 600,
                  fontSize: { xs: '0.9rem', sm: '1rem' },
                  letterSpacing: '0.01em',
                  lineHeight: 1.2 
                }}
              >
                {cancelledCount}
              </Typography>
              <Typography 
                variant="caption" 
                sx={{ 
                  color: 'rgba(255, 255, 255, 0.85)',
                  fontWeight: 500,
                  fontSize: { xs: '0.75rem', sm: '0.8rem' },
                  letterSpacing: '0.01em',
                  lineHeight: 1,
                  whiteSpace: 'nowrap',
                  overflow: 'visible',
                  textOverflow: 'clip',
                  minWidth: { xs: '60px', sm: '70px' },
                  textAlign: 'center'
                }}
              >
                Cancelled
              </Typography>
            </Stack>
          </Stack>
        </Stack>
      </Stack>
    </Box>
  );
};

export default TaskSummary;
