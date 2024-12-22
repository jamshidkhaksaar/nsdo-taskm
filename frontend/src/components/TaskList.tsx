import React, { useState } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Avatar,
  IconButton,
} from '@mui/material';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';

interface Task {
  id: string;
  title: string;
  dueDate: string;
  project?: string;
  status: 'upcoming' | 'overdue' | 'completed';
}

interface TaskListProps {
  tasks: Task[];
}

const TaskList: React.FC<TaskListProps> = ({ tasks }) => {
  const [currentTab, setCurrentTab] = useState<'upcoming' | 'overdue' | 'completed'>('overdue');

  const handleTabChange = (event: React.SyntheticEvent, newValue: 'upcoming' | 'overdue' | 'completed') => {
    setCurrentTab(newValue);
  };

  const filteredTasks = tasks.filter(task => task.status === currentTab);

  return (
    <Box sx={{ width: '100%', bgcolor: 'background.paper', borderRadius: 2, overflow: 'hidden' }}>
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Avatar sx={{ width: 32, height: 32, bgcolor: 'grey.800' }}>
          <Typography variant="body2">JK</Typography>
        </Avatar>
        <Typography variant="h6" component="h2">
          My tasks
        </Typography>
      </Box>
      
      <Tabs
        value={currentTab}
        onChange={handleTabChange}
        sx={{
          borderBottom: 1,
          borderColor: 'divider',
          '& .MuiTab-root': {
            textTransform: 'none',
            minWidth: 100,
          },
        }}
      >
        <Tab label="Upcoming" value="upcoming" />
        <Tab 
          label={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              Overdue
              <Chip 
                label="4" 
                size="small" 
                sx={{ 
                  height: 20,
                  bgcolor: 'error.main',
                  '& .MuiChip-label': { px: 1 }
                }} 
              />
            </Box>
          } 
          value="overdue" 
        />
        <Tab label="Completed" value="completed" />
      </Tabs>

      <List sx={{ py: 0 }}>
        {filteredTasks.map((task) => (
          <ListItem
            key={task.id}
            sx={{
              borderBottom: '1px solid',
              borderColor: 'divider',
              py: 1.5,
              '&:hover': {
                bgcolor: 'rgba(255, 255, 255, 0.03)',
              },
            }}
            secondaryAction={
              <IconButton edge="end" size="small">
                <MoreHorizIcon />
              </IconButton>
            }
          >
            <ListItemIcon sx={{ minWidth: 40 }}>
              <RadioButtonUncheckedIcon sx={{ color: 'text.secondary' }} />
            </ListItemIcon>
            <ListItemText
              primary={task.title}
              secondary={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                  {task.project && (
                    <Chip
                      label={task.project}
                      size="small"
                      sx={{ 
                        height: 20,
                        bgcolor: 'primary.light',
                        '& .MuiChip-label': { px: 1 }
                      }}
                    />
                  )}
                  <Typography variant="caption" color="text.secondary">
                    {task.dueDate}
                  </Typography>
                </Box>
              }
            />
          </ListItem>
        ))}
      </List>
    </Box>
  );
};

export default TaskList; 