import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Tabs, Tab, Chip, IconButton, Card, CardContent, Tooltip, CircularProgress, useTheme } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PersonIcon from '@mui/icons-material/Person';
import { Task, TaskStatus, TaskPriority, DepartmentRef } from '../../types/task';
import { Department } from '../../services/department';
import { format } from 'date-fns';

interface AssignedTasksProps {
  title: string;
  icon: React.ReactNode;
  tasks: Task[];
  departments?: Department[];
  showAssignButton?: boolean;
  onAssignTask?: () => void;
  onEditTask?: (taskId: string) => void;
  onDeleteTask?: (taskId: string) => void;
}

const AssignedTasks: React.FC<AssignedTasksProps> = ({
  title,
  icon,
  tasks,
  departments = [],
  showAssignButton = false,
  onAssignTask,
  onEditTask,
  onDeleteTask
}) => {
  const [tabValue, setTabValue] = useState(0);
  
  const getFilteredTasks = () => {
    if (tabValue === 0) return tasks; // ALL
    if (tabValue === 1) return tasks.filter(task => task.status === 'pending'); // TO DO
    if (tabValue === 2) return tasks.filter(task => task.status === 'in_progress'); // IN PROGRESS
    if (tabValue === 3) return tasks.filter(task => task.status === 'completed'); // COMPLETED
    if (tabValue === 4) return tasks.filter(task => task.status === 'cancelled'); // CANCELLED
    return tasks;
  };
  
  const filteredTasks = getFilteredTasks();

  // Update the getDepartmentName function to handle both string and DepartmentRef
  const getDepartmentName = (department: string | DepartmentRef | null) => {
    if (!department) return null;
    
    // If department is already a DepartmentRef object with a name property
    if (typeof department !== 'string' && 'name' in department) {
      return department.name;
    }
    
    // If department is a string ID, find it in the departments array
    if (typeof department === 'string') {
      const dept = departments.find((d: Department) => d.id === department);
      return dept ? dept.name : 'Unknown Department';
    }
    
    return 'Unknown Department';
  };

  return (
    <Box
      sx={{
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(8px)',
        boxShadow: '0 4px 16px 0 rgba(31, 38, 135, 0.37)',
        border: '1px solid rgba(255, 255, 255, 0.18)',
        mb: 3,
        borderRadius: '8px',
        color: '#fff',
        p: 2
      }}
    >
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {icon}
          <Typography variant="h6" sx={{ color: '#fff' }}>
            {title}
          </Typography>
        </Box>
        {showAssignButton && (
          <Button
            variant="contained"
            startIcon={<Box component="span" sx={{ display: 'flex', alignItems: 'center' }}>+</Box>}
            onClick={onAssignTask}
            sx={{
              backgroundColor: 'rgba(52, 152, 219, 0.8)',
              color: '#fff',
              '&:hover': {
                backgroundColor: 'rgba(41, 128, 185, 0.9)',
              },
              borderRadius: '4px',
            }}
          >
            Assign Task
          </Button>
        )}
      </Box>

      <Tabs
        value={tabValue}
        onChange={(_, newValue) => setTabValue(newValue)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{
          '& .MuiTab-root': {
            color: 'rgba(255, 255, 255, 0.7)',
            textTransform: 'uppercase',
            fontSize: '0.75rem',
            minWidth: 'auto',
            padding: '6px 12px',
            '&.Mui-selected': {
              color: '#fff',
              fontWeight: 'bold',
            },
          },
          '& .MuiTabs-indicator': {
            backgroundColor: '#3498db',
            height: '3px',
          },
          mb: 2,
          borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
        }}
      >
        <Tab label="All" />
        <Tab label="To Do" />
        <Tab label="In Progress" />
        <Tab label="Completed" />
        <Tab label="Cancelled" />
      </Tabs>

      {filteredTasks.length === 0 ? (
        <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)', textAlign: 'center', py: 4 }}>
          No tasks {title.toLowerCase()}
        </Typography>
      ) : (
        filteredTasks.map(task => (
          <Box 
            key={task.id}
            sx={{
              p: 2,
              mb: 2,
              borderRadius: '4px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              background: 'rgba(255, 255, 255, 0.05)',
              '&:hover': {
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
                background: 'rgba(255, 255, 255, 0.1)',
              },
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#fff' }}>
                {task.title}
              </Typography>
              <Box>
                <Chip 
                  label={task.priority.toUpperCase()} 
                  size="small"
                  sx={{ 
                    mr: 1,
                    backgroundColor: task.priority === 'high' ? 'rgba(255, 107, 107, 0.8)' : 
                                    task.priority === 'medium' ? 'rgba(254, 202, 87, 0.8)' : 'rgba(29, 209, 161, 0.8)',
                    color: task.priority === 'medium' ? '#000' : '#fff',
                    fontWeight: 'bold',
                    fontSize: '0.7rem',
                  }}
                />
                <Chip 
                  label={task.status.replace('_', ' ').toUpperCase()} 
                  size="small"
                  sx={{ 
                    backgroundColor: task.status === 'pending' ? 'rgba(52, 152, 219, 0.8)' : 
                                    task.status === 'in_progress' ? 'rgba(155, 89, 182, 0.8)' : 
                                    task.status === 'completed' ? 'rgba(46, 204, 113, 0.8)' : 'rgba(149, 165, 166, 0.8)',
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: '0.7rem',
                  }}
                />
              </Box>
            </Box>
            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)', mb: 1 }}>
              {task.description.length > 100 ? `${task.description.substring(0, 100)}...` : task.description}
            </Typography>
            
            {/* Display assignment information */}
            <Box sx={{ mb: 1 }}>
              {task.department && (
                <Chip
                  label={`Department: ${getDepartmentName(task.department)}`}
                  size="small"
                  sx={{
                    mr: 1,
                    mb: 1,
                    backgroundColor: 'rgba(224, 247, 250, 0.2)',
                    color: '#e0f7fa',
                    fontSize: '0.7rem',
                  }}
                />
              )}
              {task.assigned_to && (
                <Chip
                  label={`${task.assigned_to?.length ?? 0} User${(task.assigned_to?.length ?? 0) === 1 ? '' : 's'} Assigned`}
                  size="small"
                  sx={{
                    mr: 1,
                    mb: 1,
                    backgroundColor: 'rgba(232, 245, 233, 0.2)',
                    color: '#e8f5e9',
                    fontSize: '0.7rem',
                  }}
                />
              )}
            </Box>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <AccessTimeIcon sx={{ fontSize: '0.9rem', color: 'rgba(255, 255, 255, 0.7)', mr: 0.5 }} />
                <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                  Due: {format(new Date(task.due_date), 'MMM dd, yyyy')}
                </Typography>
              </Box>
              <Box>
                {onEditTask && (
                  <IconButton 
                    size="small" 
                    sx={{ color: '#64b5f6' }}
                    onClick={() => onEditTask(task.id)}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                )}
                {onDeleteTask && (
                  <IconButton 
                    size="small" 
                    sx={{ color: '#e57373' }}
                    onClick={() => {
                      if (window.confirm('Are you sure you want to delete this task?')) {
                        onDeleteTask(task.id);
                      }
                    }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                )}
              </Box>
            </Box>
          </Box>
        ))
      )}
    </Box>
  );
};

export default AssignedTasks;
