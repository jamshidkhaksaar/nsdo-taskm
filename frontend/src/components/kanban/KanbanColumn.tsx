import React from 'react';
import { Box, Typography, Chip, alpha, useTheme, IconButton } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { Task, TaskStatus } from '../../types';
import TaskCard from './TaskCard';
import { Draggable } from '@hello-pangea/dnd';
import { getGlassmorphismStyles } from '../../utils/glassmorphismStyles';

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
  const glassmorphismStyles = getGlassmorphismStyles(theme);

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
  const columnBgColorBase = alpha(theme.palette.grey[800], 0.4);
  const columnBgColorDragging = alpha(theme.palette.grey[700], 0.6);

  return (
    <Box
      sx={{
        height: '100%',
        minWidth: '300px',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: isDraggingOver ? columnBgColorDragging : columnBgColorBase,
        backdropFilter: 'blur(12px)',
        borderRadius: '16px',
        border: `1px solid ${alpha(theme.palette.common.white, 0.18)}`,
        boxShadow: isDraggingOver
          ? `0 8px 32px ${alpha(theme.palette.common.black, 0.3)}`
          : `0 4px 15px ${alpha(theme.palette.common.black, 0.2)}`,
        p: 1.5,
        transition: 'background-color 0.2s ease, box-shadow 0.3s ease',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, px: 0.5, flexShrink: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconComponent sx={{ fontSize: '1.2rem', color: statusColor }} />
          <Typography
            variant="h6"
            sx={{
              color: theme.palette.text.primary,
              fontWeight: 600,
              lineHeight: 1.2,
            }}
          >
            {title}
          </Typography>
          <Chip
            label={tasks.length}
            size="small"
            sx={{
              bgcolor: alpha(statusColor, 0.2),
              color: statusColor,
              fontWeight: 'bold',
              height: '22px',
              fontSize: '0.75rem',
              borderRadius: '6px',
              ml: 0.5,
              '& .MuiChip-label': {
                padding: '0 6px',
              },
            }}
          />
        </Box>
        {onCreateTask && (columnId === TaskStatus.PENDING || columnId === TaskStatus.IN_PROGRESS) && (
            <IconButton
                size="small"
                onClick={() => onCreateTask(columnId)}
                sx={{
                  color: theme.palette.text.secondary,
                  bgcolor: alpha(theme.palette.common.white, 0.1),
                  '&:hover': { bgcolor: alpha(theme.palette.common.white, 0.2) }
                }}
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
        pr: 0.5,
        pl: 0.5,
        mx: -0.5,
        '&::-webkit-scrollbar': {
          width: '8px'
        },
        '&::-webkit-scrollbar-track': {
          background: 'transparent',
          borderRadius: '4px',
        },
        '&::-webkit-scrollbar-thumb': {
          background: alpha(theme.palette.common.white, 0.2),
          borderRadius: '4px',
          border: `1px solid ${alpha(theme.palette.common.white, 0.1)}`,
          '&:hover': {
            background: alpha(theme.palette.common.white, 0.4),
          }
        }
      }}>
        {tasks.map((task, index) => (
          <Draggable key={task.id} draggableId={String(task.id)} index={index}>
              {(provided, snapshot) => (
                  <Box
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      onClick={() => onTaskClick(task)}
                      sx={{
                          mb: 1.5,
                          userSelect: 'none',
                          opacity: snapshot.isDragging ? 0.9 : 1,
                          transform: snapshot.isDragging ? 'scale(1.03) rotate(1deg)' : 'none',
                          boxShadow: snapshot.isDragging ? theme.shadows[8] : 'none',
                          transition: 'opacity 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease',
                          position: 'relative',
                          zIndex: snapshot.isDragging ? 100 : 1,
                          cursor: 'pointer',
                      }}
                  >
                      <TaskCard
                          task={task}
                          statusColor={getStatusColor(task.status as TaskStatus, theme)}
                          onEdit={onEditTask}
                          onDelete={onDeleteTask}
                          onChangeStatus={onChangeTaskStatus}
                          getUserName={getUserName}
                          formatDate={formatDate}
                          theme={theme}
                      />
                  </Box>
              )}
          </Draggable>
        ))}
        {tasks.length === 0 && (
          <Box
            sx={{
              minHeight: '80px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              p: 2,
              color: theme.palette.text.disabled,
              fontSize: '0.875rem',
              textAlign: 'center',
              border: `2px dashed ${alpha(theme.palette.common.white, 0.2)}`,
              borderRadius: '12px',
              mt: 1,
              bgcolor: alpha(theme.palette.common.black, 0.1),
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