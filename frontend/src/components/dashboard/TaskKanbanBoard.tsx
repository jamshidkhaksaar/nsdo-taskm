import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Chip, 
  IconButton, 
  Card, 
  CardContent, 
  Tooltip,
  Avatar,
  AvatarGroup
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import FlagIcon from '@mui/icons-material/Flag';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import { Task } from '../../types/task';
import { Department } from '../../services/department';
import { format } from 'date-fns';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { TaskService } from '../../services/task';

// Fix for react-beautiful-dnd with React 18
// This is needed because react-beautiful-dnd has issues with React 18's Strict Mode
// See: https://github.com/atlassian/react-beautiful-dnd/issues/2399
const ReactBeautifulDndContext = ({ children }: { children: React.ReactNode }) => {
  // Use useEffect to ensure this only runs on the client side
  const [enabled, setEnabled] = useState(false);
  
  useEffect(() => {
    const animation = requestAnimationFrame(() => setEnabled(true));
    return () => {
      cancelAnimationFrame(animation);
      setEnabled(false);
    };
  }, []);
  
  if (!enabled) {
    return null;
  }
  
  return <>{children}</>;
};

interface TaskKanbanBoardProps {
  tasks: Task[];
  departments: Department[];
  onCreateTask: () => void;
  onEditTask: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
  compact?: boolean;
}

const TaskKanbanBoard: React.FC<TaskKanbanBoardProps> = ({
  tasks,
  departments,
  onCreateTask,
  onEditTask,
  onDeleteTask,
  compact = false
}) => {
  const [hoveredTaskId, setHoveredTaskId] = useState<string | null>(null);
  const [localTasks, setLocalTasks] = useState<Task[]>(tasks);
  
  // Update local tasks when props change
  useEffect(() => {
    setLocalTasks(tasks);
  }, [tasks]);
  
  // Group tasks by status
  const pendingTasks = localTasks.filter(task => task.status === 'pending');
  const inProgressTasks = localTasks.filter(task => task.status === 'in_progress');
  const completedTasks = localTasks.filter(task => task.status === 'completed');
  
  // Handle drag end
  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    // If dropped outside a droppable area or in the same place
    if (!destination || 
        (destination.droppableId === source.droppableId && 
         destination.index === source.index)) {
      return;
    }

    // Find the task that was dragged
    const task = localTasks.find(t => String(t.id) === draggableId);
    if (!task) {
      return;
    }

    // Determine the new status based on the destination column
    let newStatus: 'pending' | 'in_progress' | 'completed';
    if (destination.droppableId === 'pending') {
      newStatus = 'pending';
    } else if (destination.droppableId === 'in_progress') {
      newStatus = 'in_progress';
    } else if (destination.droppableId === 'completed') {
      newStatus = 'completed';
    } else {
      return; // Invalid destination
    }

    // If status hasn't changed, no need to update
    if (newStatus === task.status) {
      return;
    }

    // Update the task locally first for immediate UI feedback
    const updatedTasks = localTasks.map(t => 
      String(t.id) === draggableId ? { ...t, status: newStatus } : t
    );
    setLocalTasks(updatedTasks);

    try {
      // Update the task on the server
      await TaskService.updateTask(task.id, { status: newStatus });
    } catch (error) {
      console.error('Failed to update task status:', error);
      // Revert to original tasks if the update fails
      setLocalTasks(tasks);
    }
  };

  // Task card component
  const TaskCard = ({ task, index }: { task: Task, index: number }) => {
    const isHovered = hoveredTaskId === task.id;
    const dueDate = new Date(task.due_date);
    const isPastDue = dueDate < new Date() && task.status !== 'completed';
    
    // Get priority color
    const getPriorityColor = (priority: string) => {
      switch (priority.toLowerCase()) {
        case 'high':
          return '#e74c3c';
        case 'medium':
          return '#f39c12';
        case 'low':
          return '#2ecc71';
        default:
          return '#3498db';
      }
    };
    
    // Ensure task.id is a string
    const draggableId = String(task.id);
    
    return (
      <Draggable draggableId={draggableId} index={index}>
        {(provided, snapshot) => (
          <Card
            ref={provided.innerRef}
            {...provided.draggableProps}
            sx={{
              background: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(8px)',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              mb: 1,
              transition: 'all 0.2s ease-in-out',
              transform: isHovered ? 'translateY(-2px)' : 'none',
              boxShadow: isHovered 
                ? '0 6px 12px rgba(0, 0, 0, 0.2)' 
                : '0 2px 6px rgba(0, 0, 0, 0.1)',
              position: 'relative',
              overflow: 'visible',
              '&::before': isPastDue ? {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                width: '4px',
                height: '100%',
                backgroundColor: '#e74c3c',
                borderRadius: '4px 0 0 4px',
              } : {},
              ...(snapshot.isDragging ? {
                boxShadow: '0 8px 16px rgba(0, 0, 0, 0.3)',
                opacity: 0.8,
              } : {}),
            }}
            onMouseEnter={() => setHoveredTaskId(task.id)}
            onMouseLeave={() => setHoveredTaskId(null)}
          >
            <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', width: '80%' }}>
                  <Box {...provided.dragHandleProps}>
                    <DragIndicatorIcon sx={{ color: 'rgba(255, 255, 255, 0.5)', mr: 0.5, fontSize: '1rem' }} />
                  </Box>
                  <Typography 
                    variant="body2"
                    sx={{ 
                      color: '#fff', 
                      fontWeight: 600,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {task.title}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                  <Tooltip title="Edit task">
                    <IconButton 
                      size="small" 
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditTask(task.id);
                      }}
                      sx={{ 
                        color: 'rgba(255, 255, 255, 0.7)',
                        padding: '2px',
                        '&:hover': { color: '#fff', backgroundColor: 'rgba(255, 255, 255, 0.1)' }
                      }}
                    >
                      <EditIcon sx={{ fontSize: '0.9rem' }} />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete task">
                    <IconButton 
                      size="small" 
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm('Are you sure you want to delete this task?')) {
                          onDeleteTask(task.id);
                        }
                      }}
                      sx={{ 
                        color: 'rgba(255, 255, 255, 0.7)',
                        padding: '2px',
                        '&:hover': { color: '#e74c3c', backgroundColor: 'rgba(255, 255, 255, 0.1)' }
                      }}
                    >
                      <DeleteIcon sx={{ fontSize: '0.9rem' }} />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 0.5 }}>
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                  <Chip
                    icon={<FlagIcon style={{ color: getPriorityColor(task.priority), fontSize: '0.7rem' }} />}
                    label={task.priority.toUpperCase()}
                    size="small"
                    sx={{
                      backgroundColor: `${getPriorityColor(task.priority)}20`,
                      color: getPriorityColor(task.priority),
                      fontWeight: 600,
                      fontSize: '0.6rem',
                      height: '16px',
                      '& .MuiChip-label': { px: 0.5 },
                      '& .MuiChip-icon': { ml: 0.5, mr: 0 }
                    }}
                  />
                  
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <AccessTimeIcon sx={{ fontSize: '0.7rem', color: 'rgba(255, 255, 255, 0.7)', mr: 0.3 }} />
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        color: isPastDue ? '#e74c3c' : 'rgba(255, 255, 255, 0.7)',
                        fontWeight: isPastDue ? 600 : 400,
                        fontSize: '0.6rem'
                      }}
                    >
                      {format(new Date(task.due_date), 'MMM dd')}
                    </Typography>
                  </Box>
                </Box>
                
                {task.assigned_to && task.assigned_to.length > 0 && (
                  <AvatarGroup max={2} sx={{ '& .MuiAvatar-root': { width: 16, height: 16, fontSize: '0.6rem' } }}>
                    {task.assigned_to.map((userId, index) => (
                      <Avatar key={index} sx={{ bgcolor: `hsl(${(index * 70) % 360}, 70%, 50%)` }}>
                        {userId.substring(0, 1)}
                      </Avatar>
                    ))}
                  </AvatarGroup>
                )}
              </Box>
            </CardContent>
          </Card>
        )}
      </Draggable>
    );
  };

  // Column component
  const TaskColumn = ({ 
    title, 
    tasks, 
    color,
    emptyMessage,
    droppableId
  }: { 
    title: string; 
    tasks: Task[]; 
    color: string;
    emptyMessage: string;
    droppableId: string;
  }) => {
    // Use a stable reference for droppableId
    const stableDroppableId = useRef(droppableId).current;
    
    return (
      <Box
        sx={{
          background: 'rgba(255, 255, 255, 0.03)',
          backdropFilter: 'blur(8px)',
          borderRadius: compact ? '8px' : '12px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Box
          sx={{
            p: compact ? 1.5 : 2,
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant={compact ? "body1" : "h6"} sx={{ color: '#fff', fontWeight: 600 }}>
              {title}
            </Typography>
            <Chip
              label={tasks.length}
              size="small"
              sx={{
                ml: 1,
                backgroundColor: `${color}20`,
                color: color,
                fontWeight: 600,
                minWidth: '28px',
                height: '20px',
              }}
            />
          </Box>
          
          {stableDroppableId === 'pending' && (
            <Button
              startIcon={<AddIcon />}
              onClick={onCreateTask}
              size="small"
              sx={{
                color: '#fff',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '4px',
                textTransform: 'none',
                padding: '4px 8px',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                },
              }}
            >
              Add
            </Button>
          )}
        </Box>
        
        <Droppable droppableId={stableDroppableId}>
          {(provided, snapshot) => (
            <Box
              ref={provided.innerRef}
              {...provided.droppableProps}
              sx={{
                p: compact ? 1 : 1.5,
                flexGrow: 1,
                height: '100%', // Fill the container
                overflowY: 'auto',
                '&::-webkit-scrollbar': {
                  width: '6px',
                },
                '&::-webkit-scrollbar-track': {
                  background: 'rgba(0,0,0,0.05)',
                },
                '&::-webkit-scrollbar-thumb': {
                  background: 'rgba(0,0,0,0.1)',
                  borderRadius: '3px',
                  '&:hover': {
                    background: 'rgba(0,0,0,0.2)',
                  },
                },
                ...(snapshot.isDraggingOver ? {
                  background: 'rgba(255, 255, 255, 0.08)',
                } : {}),
              }}
            >
              {tasks.length > 0 ? (
                tasks.map((task, index) => (
                  <TaskCard key={task.id} task={task} index={index} />
                ))
              ) : (
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: 'rgba(255, 255, 255, 0.5)', 
                    textAlign: 'center',
                    fontStyle: 'italic',
                    mt: 2 
                  }}
                >
                  {emptyMessage}
                </Typography>
              )}
              {provided.placeholder}
            </Box>
          )}
        </Droppable>
      </Box>
    );
  };

  return (
    <ReactBeautifulDndContext>
      <DragDropContext onDragEnd={handleDragEnd}>
        <Box
          sx={{
            height: '100%',
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, 1fr)',
              md: 'repeat(3, 1fr)',
            },
            gap: compact ? 1 : 2,
            p: compact ? 1 : 2,
            backgroundColor: 'transparent', // Remove background to avoid nested scroll containers
            overflow: 'visible', // Prevent scroll container
          }}
        >
          <TaskColumn
            title="To Do"
            tasks={pendingTasks}
            color="#3498db"
            emptyMessage="No tasks to do"
            droppableId="pending"
          />
          
          <TaskColumn
            title="In Progress"
            tasks={inProgressTasks}
            color="#f39c12"
            emptyMessage="No tasks in progress"
            droppableId="in_progress"
          />
          
          <TaskColumn
            title="Completed"
            tasks={completedTasks}
            color="#2ecc71"
            emptyMessage="No completed tasks"
            droppableId="completed"
          />
        </Box>
      </DragDropContext>
    </ReactBeautifulDndContext>
  );
};

export default TaskKanbanBoard; 