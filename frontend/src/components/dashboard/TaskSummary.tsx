import React, { useMemo } from 'react';
import { Box, Typography, Stack, Divider } from '@mui/material';
import PendingIcon from '@mui/icons-material/Pending';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import { Task } from '../../types/task';

interface TaskSummaryProps {
  tasks: Task[];
  compact?: boolean;
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
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        p: { xs: 1.25, sm: 1.5 },
        height: { xs: 'auto', sm: '100%' },
        minHeight: { xs: 'auto', sm: 'auto' },
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          boxShadow: '0 6px 16px rgba(0, 0, 0, 0.2)',
          transform: 'translateY(-2px)'
        }
      }}
    >
      <Stack 
        direction={{ xs: 'column', sm: 'row' }} 
        divider={<Divider orientation="vertical" flexItem sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} />}
        spacing={2}
        alignItems="center"
        justifyContent="space-between"
        flexWrap="wrap"
        sx={{ width: '100%' }}
      >
        <Box sx={{ 
          minWidth: 120, 
          width: { xs: '100%', sm: 'auto' }, 
          mb: { xs: 1, sm: 0 },
          textAlign: { xs: 'center', sm: 'left' },
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center'
        }}>
          <Typography 
            variant="subtitle1" 
            sx={{ 
              color: '#fff', 
              fontWeight: 600, 
              mb: 0.5,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              letterSpacing: '0.015em'
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
              mx: { xs: 'auto', sm: 0 }
            }}
          >
            <Typography 
              variant="caption" 
              sx={{ 
                color: 'rgba(255, 255, 255, 0.8)',
                fontWeight: 500,
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
          divider={<Divider orientation="vertical" flexItem sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} />} 
          flexWrap="wrap" 
          justifyContent="space-evenly"
          alignItems="center"
          sx={{ 
            overflow: 'visible',
            px: 2,
            py: 0.75
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
              transition: 'all 0.2s',
              '&:hover': { bgcolor: 'rgba(243, 156, 18, 0.08)' }
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
              <Typography variant="body2" sx={{ color: '#fff', fontWeight: 700, lineHeight: 1.2 }}>
                {pendingCount}
              </Typography>
              <Typography 
                variant="caption" 
                sx={{ 
                  color: 'rgba(255, 255, 255, 0.7)', 
                  lineHeight: 1,
                  whiteSpace: 'nowrap',
                  overflow: 'visible',
                  textOverflow: 'clip',
                  minWidth: { xs: '70px', sm: '80px' },
                  fontSize: '0.7rem',
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
              transition: 'all 0.2s',
              '&:hover': { bgcolor: 'rgba(155, 89, 182, 0.08)' }
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
              <Typography variant="body2" sx={{ color: '#fff', fontWeight: 700, lineHeight: 1.2 }}>
                {inProgressCount}
              </Typography>
              <Typography 
                variant="caption" 
                sx={{ 
                  color: 'rgba(255, 255, 255, 0.7)', 
                  lineHeight: 1,
                  whiteSpace: 'nowrap',
                  overflow: 'visible',
                  textOverflow: 'clip',
                  minWidth: { xs: '60px', sm: '70px' },
                  fontSize: '0.7rem',
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
              transition: 'all 0.2s',
              '&:hover': { bgcolor: 'rgba(46, 204, 113, 0.08)' }
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
              <Typography variant="body2" sx={{ color: '#fff', fontWeight: 700, lineHeight: 1.2 }}>
                {completedCount}
              </Typography>
              <Typography 
                variant="caption" 
                sx={{ 
                  color: 'rgba(255, 255, 255, 0.7)', 
                  lineHeight: 1,
                  whiteSpace: 'nowrap',
                  overflow: 'visible',
                  textOverflow: 'clip',
                  minWidth: { xs: '60px', sm: '70px' },
                  fontSize: '0.7rem',
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
              transition: 'all 0.2s',
              '&:hover': { bgcolor: 'rgba(231, 76, 60, 0.08)' }
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
              <Typography variant="body2" sx={{ color: '#fff', fontWeight: 700, lineHeight: 1.2 }}>
                {cancelledCount}
              </Typography>
              <Typography 
                variant="caption" 
                sx={{ 
                  color: 'rgba(255, 255, 255, 0.7)', 
                  lineHeight: 1,
                  whiteSpace: 'nowrap',
                  overflow: 'visible',
                  textOverflow: 'clip',
                  minWidth: { xs: '60px', sm: '70px' },
                  fontSize: '0.7rem',
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