import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Avatar,
  CardActions,
  Button,
  IconButton,
  useTheme,
  Menu,
  MenuItem,
  Tooltip,
} from '@mui/material';
import { 
  Edit as EditIcon, 
  Delete as DeleteIcon,
  Business as BusinessIcon,
  AccessTime as AccessTimeIcon,
  PriorityHigh as PriorityHighIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { Task, TaskPriority, TaskStatus } from '../../types/task';
import { useTaskPermissions } from '../../hooks/useTaskPermissions';
import { User } from '../../types/user';
import { Department } from '../../services/department';

// Custom styles for the components
const customStyles = {
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(10px)',
    borderRadius: '12px',
    boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
  },
  chip: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(5px)',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  text: {
    primary: {
      color: 'rgba(255, 255, 255, 0.9)',
    },
    secondary: {
      color: 'rgba(255, 255, 255, 0.7)',
    },
  },
  iconButton: {
    color: 'rgba(255, 255, 255, 0.7)',
    '&:hover': {
      color: '#fff',
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
  },
  button: {
    color: 'rgba(255, 255, 255, 0.7)',
    '&:hover': {
      color: '#fff',
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
  },
};

interface TaskCardProps {
  task: Task;
  onEdit?: (task: Task) => void;
  onDelete?: (taskId: string) => void;
  onStatusChange?: (taskId: string, newStatus: string) => void;
  users?: User[];
  departments?: Department[];
  currentUserId: number;
  onClick?: () => void;
}

const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onEdit,
  onDelete,
  onStatusChange,
  users = [],
  departments = [],
  currentUserId,
  onClick,
}) => {
  const theme = useTheme();
  const permissions = useTaskPermissions(task);
  const [statusAnchorEl, setStatusAnchorEl] = useState<null | HTMLElement>(null);
  
  // Format due date
  const formattedDueDate = task.due_date 
    ? format(new Date(task.due_date), 'MMM d, yyyy h:mm a')
    : 'No due date';
  
  // Get priority color
  const getPriorityColor = (priority: TaskPriority): string => {
    switch (priority) {
      case 'high': return theme.palette.error.main;
      case 'medium': return theme.palette.warning.main;
      case 'low': return theme.palette.success.main;
      default: return theme.palette.info.main;
    }
  };
  
  // Get status color
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'completed': return theme.palette.success.main;
      case 'in_progress': return theme.palette.warning.main;
      case 'cancelled': return theme.palette.error.main;
      default: return theme.palette.info.main;
    }
  };

  // Get status label
  const getStatusLabel = (status: string): string => {
    switch (status) {
      case 'pending': return 'Pending';
      case 'in_progress': return 'In Progress';
      case 'completed': return 'Completed';
      case 'cancelled': return 'Cancelled';
      default: return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };
  
  // Handle status change
  const handleStatusChange = (newStatus: string) => {
    setStatusAnchorEl(null);
    if (onStatusChange) {
      onStatusChange(task.id, newStatus);
    }
  };
  
  // Find creator name
  const creator = users.find(user => user.id.toString() === task.created_by);
  const creatorName = creator ? `${creator.first_name} ${creator.last_name}` : 'Unknown';
  
  // Find department name if applicable
  const departmentId = typeof task.department === 'string' 
    ? task.department 
    : task.department?.id;
  const department = departments.find(dept => dept.id === departmentId);
  const departmentName = department?.name || 'None';
  
  // Find assignees or collaborators
  const assignedUsers = users.filter(user => 
    task.assigned_to?.includes(user.id.toString())
  );
  
  return (
    <Card sx={{ 
      ...customStyles.card,
      mb: 2,
      position: 'relative',
      overflow: 'visible'
    }}>
      {/* Priority indicator */}
      <Box 
        sx={{ 
          position: 'absolute', 
          top: '-8px', 
          right: '-8px', 
          width: '24px', 
          height: '24px', 
          borderRadius: '50%', 
          backgroundColor: getPriorityColor(task.priority),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <PriorityHighIcon sx={{ fontSize: '16px', color: '#fff' }} />
      </Box>
      
      <CardContent>
        <Typography variant="h6" sx={{ mb: 1, ...customStyles.text.primary }}>
        {/* Context label for assignment/delegation */}
        {(() => {
          // "Myself" for personal tasks
          if (task.type === 'user' && task.created_by?.toString() === currentUserId.toString()) {
            return <Chip label="Myself" size="small" sx={{ ...customStyles.chip, mb: 1, mr: 1 }} />;
          }
          // "Assigned by [username]" for tasks assigned to user
          if (task.type === 'user' && task.created_by?.toString() !== currentUserId.toString()) {
            return <Chip label={`Assigned by ${creatorName}`} size="small" sx={{ ...customStyles.chip, mb: 1, mr: 1 }} />;
          }
          // "Assigned to [department] by myself" for department tasks
          if (task.type === 'department' && task.created_by?.toString() === currentUserId.toString()) {
            return <Chip label={`Assigned to ${departmentName} by myself`} size="small" sx={{ ...customStyles.chip, mb: 1, mr: 1 }} />;
          }
          // "Assigned to [province], [departments] by myself" for province tasks
          if (task.type === 'province' && task.created_by?.toString() === currentUserId.toString()) {
            return <Chip label={`Assigned to province by myself`} size="small" sx={{ ...customStyles.chip, mb: 1, mr: 1 }} />;
          }
          // "Delegated to [user]" for delegated tasks
          if (task.delegatedByUserId) {
            const delegatedUser = users.find(u => u.id.toString() === task.delegatedByUserId?.toString());
            return <Chip label={`Delegated to ${delegatedUser ? delegatedUser.first_name + ' ' + delegatedUser.last_name : 'user'}`} size="small" sx={{ ...customStyles.chip, mb: 1, mr: 1 }} />;
          }
          return null;
        })()}
          {task.title}
        </Typography>
        
        <Typography variant="body2" sx={{ mb: 2, ...customStyles.text.secondary }}>
          {task.description}
        </Typography>
        
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
          <Chip 
            label={getStatusLabel(task.status)}
            size="small"
            onClick={(e) => permissions.canManageStatus ? setStatusAnchorEl(e.currentTarget) : null}
            sx={{ 
              backgroundColor: getStatusColor(task.status),
              color: '#fff',
              cursor: permissions.canManageStatus ? 'pointer' : 'default',
              '&:hover': permissions.canManageStatus ? {
                opacity: 0.9
              } : {}
            }} 
            deleteIcon={permissions.canManageStatus ? <KeyboardArrowDownIcon /> : undefined}
            onDelete={permissions.canManageStatus ? (e) => setStatusAnchorEl(e.currentTarget) : undefined}
          />
          
          <Menu
            anchorEl={statusAnchorEl}
            open={Boolean(statusAnchorEl)}
            onClose={() => setStatusAnchorEl(null)}
          >
            {Object.values(TaskStatus).map((status) => (
              <MenuItem
                key={status}
                onClick={() => handleStatusChange(status)}
                sx={{
                  minWidth: 120,
                  backgroundColor: task.status === status ? 'rgba(0, 0, 0, 0.04)' : 'transparent'
                }}
              >
                <Box 
                  sx={{ 
                    width: 8, 
                    height: 8, 
                    borderRadius: '50%', 
                    backgroundColor: getStatusColor(status),
                    mr: 1
                  }} 
                />
                {getStatusLabel(status)}
              </MenuItem>
            ))}
          </Menu>
          
          <Chip 
            icon={<AccessTimeIcon />} 
            label={formattedDueDate} 
            size="small"
            sx={customStyles.chip} 
          />
        </Box>
        
        {/* Creator and Assignment Info - Context Specific Display */}
        <Box sx={{ mt: 2 }}>
          <Typography variant="caption" sx={{ display: 'block', mb: 0.5, ...customStyles.text.secondary }}>
            Created by: {creatorName}
          </Typography>
          
          {task.context === 'department' && (
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
              <BusinessIcon sx={{ fontSize: '18px', mr: 0.5, ...customStyles.text.secondary }} />
              <Typography variant="caption" sx={{ ...customStyles.text.secondary }}>
                Assigned to department: {departmentName}
              </Typography>
            </Box>
          )}
          
          {task.context === 'user' && assignedUsers.length > 0 && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="caption" sx={{ display: 'block', mb: 0.5, ...customStyles.text.secondary }}>
                Assigned to:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {assignedUsers.map(user => (
                  <Chip
                    key={user.id}
                    avatar={<Avatar>{user.first_name.charAt(0)}</Avatar>}
                    label={`${user.first_name} ${user.last_name}`}
                    size="small"
                    sx={customStyles.chip}
                  />
                ))}
              </Box>
            </Box>
          )}
          
          {task.context === 'personal' && assignedUsers.length > 0 && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="caption" sx={{ display: 'block', mb: 0.5, ...customStyles.text.secondary }}>
                Collaborators:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {assignedUsers.map(user => (
                  <Chip
                    key={user.id}
                    avatar={<Avatar>{user.first_name.charAt(0)}</Avatar>}
                    label={`${user.first_name} ${user.last_name}`}
                    size="small"
                    sx={customStyles.chip}
                  />
                ))}
              </Box>
            </Box>
          )}
        </Box>
      </CardContent>
      
      {/* Actions */}
      {(permissions.canEdit || permissions.canDelete || permissions.canManageStatus) && (
        <CardActions sx={{ justifyContent: 'flex-end', borderTop: '1px solid rgba(255, 255, 255, 0.1)', pt: 1 }}>
          {permissions.canEdit && onEdit && (
            <IconButton 
              size="small" 
              onClick={() => onEdit(task)}
              sx={customStyles.iconButton}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          )}
          
          {permissions.canDelete && onDelete && (
            <IconButton 
              size="small" 
              onClick={() => onDelete(task.id)}
              sx={customStyles.iconButton}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          )}
        </CardActions>
      )}
    </Card>
  );
};

export default TaskCard; 