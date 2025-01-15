import React from 'react';
import { Box, Typography, Button } from '@mui/material';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { IconButton } from '@mui/material';
import { Task } from '../../types/task';

interface AssignedTasksProps {
  title: string;
  icon: React.ReactNode;
  tasks: Task[];
  showAssignButton?: boolean;
}

const AssignedTasks: React.FC<AssignedTasksProps> = ({
  title,
  icon,
  tasks,
  showAssignButton = false
}) => {
  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        {icon}
        <Typography variant="h6" sx={{ ml: 1 }}>
          {title}
        </Typography>
        {showAssignButton && (
          <Button variant="contained" sx={{ ml: 'auto' }}>
            Assign Task
          </Button>
        )}
      </Box>
      
      {tasks.length > 0 ? (
        tasks.map(task => (
          <Box key={task.id} sx={{ mb: 2 }}>
            <Typography>{task.title}</Typography>
            <Typography variant="body2" color="text.secondary">
              Due: {new Date(task.due_date).toLocaleDateString()}
            </Typography>
          </Box>
        ))
      ) : (
        <Typography variant="body2" color="text.secondary">
          No tasks found
        </Typography>
      )}
    </Box>
  );
};

export default AssignedTasks;
