import React from 'react';
import { Paper, Typography, Box, Chip } from '@mui/material';
import { Draggable } from '@hello-pangea/dnd';
import { Task, TaskPriority, TaskStatus, TaskType, User } from '@/types/index'; // Assuming types are here
import { useTaskPermissions } from '@/hooks/useTaskPermissions'; // To check permissions later if needed
import { format } from 'date-fns'; // For dates

interface TaskCardProps {
  task: Task;
  index: number; // Required by Draggable
  onClick: (task: Task) => void; // Handler when card is clicked
  currentUser: User | null; // Needed for visual differentiation
}

// Helper to get priority color (can be moved to utils)
const getPriorityColor = (priority: TaskPriority): string => {
  switch (priority) {
    case TaskPriority.HIGH: return 'error.main';
    case TaskPriority.MEDIUM: return 'warning.main';
    case TaskPriority.LOW: return 'info.main';
    default: return 'grey.500';
  }
};

// Helper to determine card border/style based on ownership
const getCardStyle = (task: Task, currentUser: User | null): React.CSSProperties => {
  let borderColor = 'rgba(255, 255, 255, 0.1)'; // Default
  let borderWidth = 1;

  if (!currentUser) return { border: `${borderWidth}px solid ${borderColor}` };

  const isPersonal = task.type === TaskType.PERSONAL && task.createdById === currentUser.id;
  const isAssignedToMe = task.assignedToUserIds?.includes(currentUser.id);
  const isAssignedToMyDept = currentUser.department?.id && task.assignedToDepartmentIds?.includes(currentUser.department.id);

  if (isPersonal) {
    borderColor = 'primary.main'; // Blue for personal
    borderWidth = 2;
  } else if (isAssignedToMe) {
    borderColor = 'success.main'; // Green for assigned to me
    borderWidth = 2;
  } else if (isAssignedToMyDept) {
    borderColor = 'secondary.main'; // Purple for assigned to my dept
    borderWidth = 2;
  }

  return {
     border: `${borderWidth}px solid`,
     borderColor: borderColor,
     // Add subtle background variations later if needed
  };
};


const TaskCard: React.FC<TaskCardProps> = ({ task, index, onClick, currentUser }) => {
  // TODO: Add permission check here later if needed for drag handle visibility etc.
  // const permissions = useTaskPermissions(task);
  const cardStyles = getCardStyle(task, currentUser);

  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <Paper
          ref={provided.innerRef as React.RefObject<HTMLDivElement>}
          {...provided.draggableProps}
          {...provided.dragHandleProps} // Drag handle is the whole card for now
          elevation={snapshot.isDragging ? 3 : 1}
          onClick={() => onClick(task)}
          sx={{
            p: 1.5,
            mb: 1,
            cursor: 'pointer',
            userSelect: 'none',
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(3px)',
            transition: 'background-color 0.2s ease',
            '&:hover': {
              background: 'rgba(255, 255, 255, 0.1)',
            },
            ...cardStyles, // Apply dynamic border styles
          }}
        >
          <Typography variant="subtitle2" sx={{ color: '#fff', mb: 0.5, wordBreak: 'break-word' }}>
            {task.title}
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1, mt: 1 }}>
            <Chip
              label={task.priority}
              size="small"
              sx={{
                color: '#fff',
                bgcolor: getPriorityColor(task.priority),
                fontSize: '0.7rem',
                height: '18px',
              }}
            />
            {task.dueDate && (
               <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                 Due: {format(new Date(task.dueDate), 'MMM d')}
               </Typography>
            )}
          </Box>
        </Paper>
      )}
    </Draggable>
  );
};

export default TaskCard; 