import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
  Box,
  Grid,
  Typography,
} from '@mui/material';
import { Task } from '../types/task';
import { TaskService } from '../services/task';
import { RootState } from '../store';
import AssignedTasksSection from './tasks/AssignedTasksSection';
import AssignedByMeSection from './tasks/AssignedByMeSection';
import TasksSection from './departments/TasksSection';

const Dashboard: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const [myTasks, setMyTasks] = useState<Task[]>([]);
  const [assignedToMeTasks, setAssignedToMeTasks] = useState<Task[]>([]);
  const [assignedByMeTasks, setAssignedByMeTasks] = useState<Task[]>([]);

  const fetchTasks = async () => {
    try {
      // Fetch tasks created by the current user (My Tasks)
      const myTasksResponse = await TaskService.getTasks({ task_type: 'my_tasks' });
      setMyTasks(myTasksResponse);

      // Fetch tasks assigned to the current user by others
      const assignedTasks = await TaskService.getTasks({ task_type: 'assigned' });
      setAssignedToMeTasks(assignedTasks);

      // Fetch tasks created by the current user and assigned to others
      const createdTasks = await TaskService.getTasks({ task_type: 'created' });
      setAssignedByMeTasks(createdTasks);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchTasks();
    }
  }, [user?.id]);

  const handleTaskUpdated = async (updatedTask: Task) => {
    await fetchTasks(); // Refresh all tasks
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ color: '#fff', mb: 4 }}>
        Dashboard
      </Typography>

      <Grid container spacing={4}>
        <Grid item xs={12}>
          <TasksSection
            tasks={myTasks}
            currentUserId={Number(user?.id) || 0}
            currentDepartmentId={0}
            onTaskUpdated={handleTaskUpdated}
            viewMode="assigned"
          />
        </Grid>

        <Grid item xs={12}>
          <AssignedByMeSection
            tasks={assignedByMeTasks}
            onTaskUpdated={handleTaskUpdated}
          />
        </Grid>

        <Grid item xs={12}>
          <AssignedTasksSection
            tasks={assignedToMeTasks}
            onTaskUpdated={handleTaskUpdated}
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
