import React, { useMemo, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Chip,
  IconButton,
  CircularProgress,
  Card,
  CardContent,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  useTheme,
  alpha,
} from '@mui/material';
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from '@hello-pangea/dnd';
import {
  PersonOutline as PersonIcon,
  Business as BusinessIcon,
  Forward as ForwardIcon,
  MoreVert as MoreVertIcon,
  Delete as DeleteIcon,
  Assignment as AssignmentIcon,
} from '@mui/icons-material';
import { Task, TaskStatus, User, TaskType } from '../../types';
import { format } from 'date-fns';

interface TaskKanbanBoardProps {
  tasks: Task[];
  onTaskStatusChange: (taskId: string, newStatus: TaskStatus) => Promise<boolean>;
  onTaskClick: (task: Task) => void;
  onTaskDelete?: (taskId: string, reason: string) => Promise<boolean>;
  loading: boolean;
  currentUser: User | null;
}

interface Column {
  id: TaskStatus;
  title: string;
  color: string;
  icon: React.ReactNode;
}

const columns: Column[] = [
  {
    id: TaskStatus.PENDING,
    title: 'Pending',
    color: '#2196F3',
    icon: <AssignmentIcon />,
  },
  {
    id: TaskStatus.IN_PROGRESS,
    title: 'In Progress',
    color: '#FF9800',
    icon: <PersonIcon />,
  },
  {
    id: TaskStatus.COMPLETED,
    title: 'Completed',
    color: '#4CAF50',
    icon: <PersonIcon />,
  },
];

const TaskCard: React.FC<{
  task: Task;
  index: number;
  onTaskClick: (task: Task) => void;
  onTaskDelete?: (taskId: string, reason: string) => Promise<boolean>;
  currentUser: User | null;
}> = ({ task, index, onTaskClick, onTaskDelete, currentUser }) => {
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');
  const [deleting, setDeleting] = useState(false);

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  const handleDeleteConfirm = async () => {
    if (!deleteReason.trim() || !onTaskDelete) return;
    
    setDeleting(true);
    try {
      await onTaskDelete(task.id, deleteReason.trim());
      setDeleteDialogOpen(false);
      setDeleteReason('');
    } catch (error) {
      console.error('Error deleting task:', error);
    } finally {
      setDeleting(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return '#f44336';
      case 'medium':
        return '#ff9800';
      case 'low':
        return '#4caf50';
      default:
        return '#9e9e9e';
    }
  };

  const getTaskTypeIcon = (type: TaskType) => {
    switch (type) {
      case TaskType.PERSONAL:
        return <PersonIcon fontSize="small" />;
      case TaskType.DEPARTMENT:
        return <BusinessIcon fontSize="small" />;
      case TaskType.USER:
        return <ForwardIcon fontSize="small" />;
      default:
        return <AssignmentIcon fontSize="small" />;
    }
  };

  const isPersonalTask = task.type === TaskType.PERSONAL && task.createdById === currentUser?.id;
  const isDelegatedTask = task.isDelegated;
  const canDelete = isPersonalTask;

  return (
    <>
      <Draggable draggableId={task.id} index={index}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef as any}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
          >
            <Card
              onClick={() => onTaskClick(task)}
              sx={{
                mb: 2,
                cursor: 'pointer',
                backgroundColor: snapshot.isDragging 
                  ? alpha(theme.palette.primary.main, 0.1)
                  : 'background.paper',
                borderLeft: `4px solid ${getPriorityColor(task.priority)}`,
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: theme.shadows[4],
                },
              }}
            >
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {getTaskTypeIcon(task.type)}
                    <Typography variant="subtitle2" fontWeight="600" color="text.primary">
                      {task.title}
                    </Typography>
                  </Box>
                  {canDelete && (
                    <IconButton
                      size="small"
                      onClick={handleMenuClick}
                      sx={{ opacity: 0.7, '&:hover': { opacity: 1 } }}
                    >
                      <MoreVertIcon fontSize="small" />
                    </IconButton>
                  )}
                </Box>

                {task.description && (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      mb: 2,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                    }}
                  >
                    {task.description}
                  </Typography>
                )}

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Chip
                    label={task.priority.toUpperCase()}
                    size="small"
                    sx={{
                      backgroundColor: getPriorityColor(task.priority),
                      color: 'white',
                      fontSize: '0.75rem',
                      height: '20px',
                    }}
                  />
                  {task.dueDate && (
                    <Typography variant="caption" color="text.secondary">
                      Due: {format(new Date(task.dueDate), 'MMM dd')}
                    </Typography>
                  )}
                </Box>

                {isDelegatedTask && (
                  <Box sx={{ mt: 1 }}>
                    <Chip
                      label="Delegated"
                      size="small"
                      variant="outlined"
                      color="secondary"
                      sx={{ fontSize: '0.7rem', height: '18px' }}
                    />
                  </Box>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </Draggable>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleDeleteClick}>
          <DeleteIcon sx={{ mr: 1 }} fontSize="small" />
          Delete Task
        </MenuItem>
      </Menu>

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Delete Task</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            Are you sure you want to delete "{task.title}"? This action cannot be undone.
          </Typography>
          <TextField
            autoFocus
            margin="dense"
            label="Reason for deletion"
            fullWidth
            variant="outlined"
            value={deleteReason}
            onChange={(e) => setDeleteReason(e.target.value)}
            placeholder="Please provide a reason for deleting this task..."
            multiline
            rows={3}
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
            disabled={!deleteReason.trim() || deleting}
          >
            {deleting ? <CircularProgress size={20} /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

const TaskKanbanBoard: React.FC<TaskKanbanBoardProps> = ({
  tasks,
  onTaskStatusChange,
  onTaskClick,
  onTaskDelete,
  loading,
  currentUser,
}) => {
  const theme = useTheme();

  // Filter tasks according to PRD: Only show relevant tasks for Board View
  const relevantTasks = useMemo(() => {
    if (!currentUser) return [];
    
    return tasks.filter(task => {
      // My Personal Tasks
      if (task.type === TaskType.PERSONAL && task.createdById === currentUser.id) {
        return true;
      }
      
      // Tasks Delegated to Me
      if (task.isDelegated && task.assignedToUsers?.some(user => user.id === currentUser.id)) {
        return true;
      }
      
      // Department Tasks (tasks assigned to my departments)
      if (task.type === TaskType.DEPARTMENT && 
          task.assignedToDepartments?.some(dept => 
            currentUser.departments?.some(userDept => userDept.id === dept.id)
          )) {
        return true;
      }
      
      return false;
    });
  }, [tasks, currentUser]);

  const tasksByStatus = useMemo(() => {
    return columns.reduce((acc, column) => {
      acc[column.id] = relevantTasks
        .filter(task => task.status === column.id)
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      return acc;
    }, {} as Record<TaskStatus, Task[]>);
  }, [relevantTasks]);

  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;

    if (destination.droppableId === source.droppableId && destination.index === source.index) {
      return;
    }

    const newStatus = destination.droppableId as TaskStatus;
    const task = relevantTasks.find(t => t.id === draggableId);
    
    if (!task) return;

    // Check permissions based on PRD rules
    const isPersonalTask = task.type === TaskType.PERSONAL && task.createdById === currentUser?.id;
    const isDelegatedTask = task.isDelegated;
    
    if (!isPersonalTask && !isDelegatedTask) {
      // Department tasks cannot be moved in Board View
      return;
    }

    if (isDelegatedTask && newStatus === TaskStatus.CANCELLED) {
      // Delegated task cancellation requires creator approval (not implemented in this view)
      return;
    }

    try {
      await onTaskStatusChange(draggableId, newStatus);
    } catch (error) {
      console.error('Error updating task status:', error);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', overflow: 'hidden' }}>
      <DragDropContext onDragEnd={handleDragEnd}>
        <Box sx={{ display: 'flex', gap: 3, height: '100%', overflow: 'auto', p: 2 }}>
          {columns.map((column) => {
            const columnTasks = tasksByStatus[column.id] || [];
            
            return (
              <Paper
                key={column.id}
                sx={{
                  flex: 1,
                  minWidth: '300px',
                  maxWidth: '350px',
                  display: 'flex',
                  flexDirection: 'column',
                  height: 'fit-content',
                  maxHeight: 'calc(100vh - 200px)',
                }}
              >
                <Box
                  sx={{
                    p: 2,
                    borderBottom: 1,
                    borderColor: 'divider',
                    backgroundColor: alpha(column.color, 0.1),
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                  }}
                >
                  <Box sx={{ color: column.color }}>{column.icon}</Box>
                  <Typography variant="h6" color={column.color} fontWeight="600">
                    {column.title}
                  </Typography>
                  <Chip
                    label={columnTasks.length}
                    size="small"
                    sx={{
                      ml: 'auto',
                      backgroundColor: column.color,
                      color: 'white',
                      fontWeight: 'bold',
                    }}
                  />
                </Box>

                <Droppable droppableId={column.id}>
                  {(provided, snapshot) => (
                    <Box
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      sx={{
                        p: 2,
                        flex: 1,
                        overflowY: 'auto',
                        backgroundColor: snapshot.isDraggingOver 
                          ? alpha(column.color, 0.05) 
                          : 'transparent',
                        transition: 'background-color 0.2s ease',
                        minHeight: '200px',
                      }}
                    >
                      {columnTasks.map((task, index) => (
                        <TaskCard
                          key={task.id}
                          task={task}
                          index={index}
                          onTaskClick={onTaskClick}
                          onTaskDelete={onTaskDelete}
                          currentUser={currentUser}
                        />
                      ))}
                      {provided.placeholder}
                      
                      {columnTasks.length === 0 && (
                        <Box
                          sx={{
                            textAlign: 'center',
                            py: 4,
                            color: 'text.secondary',
                          }}
                        >
                          <Typography variant="body2">
                            No tasks in {column.title.toLowerCase()}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  )}
                </Droppable>
              </Paper>
            );
          })}
        </Box>
      </DragDropContext>
    </Box>
  );
};

export default TaskKanbanBoard; 