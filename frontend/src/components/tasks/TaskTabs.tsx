import React from 'react';
import { Task } from '../../types/task';
import { Tabs, Tab, Box } from '@mui/material';

interface TaskTabsProps {
  tasks: Task[];
}

const TaskTabs: React.FC<TaskTabsProps> = ({ tasks }) => {
  const [value, setValue] = React.useState(0);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs 
          value={value} 
          onChange={handleChange}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="All Tasks" />
          <Tab label="To Do" />
          <Tab label="In Progress" />
          <Tab label="Completed" />
        </Tabs>
      </Box>
      <Box sx={{ p: 2 }}>
        {value === 0 && (
          <Box>
            {tasks.map(task => (
              <Box key={task.id}>
                {task.title}
              </Box>
            ))}
          </Box>
        )}
        {value === 1 && (
          <Box>
            {tasks.filter(t => t.status === 'todo').map(task => (
              <Box key={task.id}>
                {task.title}
              </Box>
            ))}
          </Box>
        )}
        {value === 2 && (
          <Box>
            {tasks.filter(t => t.status === 'in_progress').map(task => (
              <Box key={task.id}>
                {task.title}
              </Box>
            ))}
          </Box>
        )}
        {value === 3 && (
          <Box>
            {tasks.filter(t => t.status === 'done').map(task => (
              <Box key={task.id}>
                {task.title}
              </Box>
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default TaskTabs;
