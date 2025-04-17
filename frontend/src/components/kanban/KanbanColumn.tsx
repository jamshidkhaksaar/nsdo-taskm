import React from 'react';
import { Box, Typography, Chip, alpha, useTheme, IconButton } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { Task, TaskStatus } from '../../types';
import TaskCard from '../dashboard/TaskCard';
import { Draggable } from '@hello-pangea/dnd';

// Define the props interface
interface KanbanColumnProps {
  title: string;
  icon: React.ComponentType<any>;
  tasks: Task[];
  columnId: TaskStatus;
  isDraggingOver: boolean;
  onEditTask?: (taskId: string) => void;
  onDeleteTask?: (taskId: string) => void;
  onChangeTaskStatus?: (taskId: string, newStatus: TaskStatus) => Promise<boolean> | void;
  onTaskClick: (task: Task) => void;
  currentUser: any;
  getUserName: (userId: string) => Promise<string>;
  formatDate?: (dateString: string) => string;
  onCreateTask?: (initialStatus: TaskStatus) => void;
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({
  title,
  icon: IconComponent,
  tasks,
  columnId,
  isDraggingOver,
  onEditTask,
  onDeleteTask,
  onChangeTaskStatus,
  onTaskClick,
  currentUser,
  getUserName,
  formatDate,
  onCreateTask,
}) => {
  const theme = useTheme();

  // Get color for status
  const getStatusColor = (status: TaskStatus, theme: any): string => {
    switch (status) {
      case TaskStatus.PENDING:
        return theme.palette.warning.main;
      case TaskStatus.IN_PROGRESS:
        return theme.palette.info.main;
      case TaskStatus.COMPLETED:
        return theme.palette.success.main;
      case TaskStatus.CANCELLED:
        return theme.palette.grey[500];
      default:
        console.warn('Unknown status encountered in getStatusColor:', status);
        return theme.palette.grey[500];
    }
  };

  const statusColor = getStatusColor(columnId, theme);

  return (
    <Box
      sx={{
        height: '100%',
        bgcolor: isDraggingOver 
            ? '#2A3142'
            : '#222834',
        borderRadius: '10px',
        p: 1.5,
        display: 'flex',
        flexDirection: 'column',
        transition: 'background-color 0.2s ease',
        boxShadow: isDraggingOver ? theme.shadows[4] : theme.shadows[1],
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5, px: 0.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconComponent sx={{ fontSize: '1.1rem', color: statusColor }} />
          <Typography 
            variant="subtitle1"
            sx={{ 
              color: theme.palette.text.primary,
              fontWeight: 600,
            }}
          >
            {title}
          </Typography>
          <Chip 
            label={tasks.length} 
            size="small" 
            sx={{ 
              bgcolor: alpha(statusColor, 0.15),
              color: statusColor,
              fontWeight: 'medium',
              height: '20px',
              fontSize: '0.7rem',
              '& .MuiChip-label': {
                padding: '0 5px'
              }
            }} 
          />
        </Box>
        {onCreateTask && (columnId === TaskStatus.PENDING || columnId === TaskStatus.IN_PROGRESS) && (
            <IconButton 
                size="small" 
                onClick={() => onCreateTask(columnId)} 
                sx={{ color: theme.palette.text.secondary }}
                title={`Add Task to ${title}`}
            >
                <AddIcon fontSize="small" />
            </IconButton>
        )}
      </Box>

      <Box sx={{ 
        flexGrow: 1, 
        overflowY: 'auto',
        overflowX: 'hidden',
        minHeight: '50px',
        pr: 0.5,
        mx: -1.5,
        px: 1.5,
        '&::-webkit-scrollbar': {
          width: '6px'
        },
        '&::-webkit-scrollbar-track': {
          background: 'transparent'
        },
        '&::-webkit-scrollbar-thumb': {
          background: alpha(theme.palette.text.secondary, 0.2),
          borderRadius: '3px',
          '&:hover': {
            background: alpha(theme.palette.text.secondary, 0.4),
          }
        }
      }}>
        {tasks.map((task, index) => (
          <Draggable key={task.id} draggableId={task.id} index={index}>
              {(provided, snapshot) => (
                  <Box
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      sx={{ 
                          mb: 1.5, 
                          userSelect: 'none',
                          opacity: snapshot.isDragging ? 0.8 : 1,
                          transform: snapshot.isDragging ? 'rotate(1deg)' : 'rotate(0deg)',
                          transition: 'opacity 0.2s ease, transform 0.2s ease', 
                      }}
                  >
                      <TaskCard
                          task={task}
                          index={index}
                          onClick={() => onTaskClick(task)}
                          currentUser={currentUser}
                      />
                  </Box>
              )}
          </Draggable>
        ))}
        {tasks.length === 0 && (
          <Box 
            sx={{ 
              minHeight: '60px',
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              p: 2,
              color: theme.palette.text.disabled,
              fontSize: '0.875rem',
              textAlign: 'center',
              border: `1px dashed ${theme.palette.divider}`,
              borderRadius: '8px',
              mt: 1
            }}
          >
            No tasks in {title}
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default KanbanColumn; 