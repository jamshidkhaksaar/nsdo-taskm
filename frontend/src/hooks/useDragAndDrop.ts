import { useState, useEffect } from 'react';
import { Task, TaskStatus } from '../types/task';
import { TaskService } from '../services/task';
import { DropResult } from 'react-beautiful-dnd';

export const useDragAndDrop = (initialTasks: Task[]) => {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);

  // Update tasks when initialTasks change
  useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  // Group tasks by status
  const pendingTasks = tasks.filter(task => task.status === 'pending');
  const inProgressTasks = tasks.filter(task => task.status === 'in_progress');
  const completedTasks = tasks.filter(task => task.status === 'completed');

  // Handle drag end
  const handleDragEnd = async (result: DropResult) => {
    console.log('Drag ended with result:', result);
    const { destination, source, draggableId } = result;

    // If dropped outside a droppable area
    if (!destination) {
      console.log('Dropped outside droppable area');
      return;
    }

    // If dropped in the same place
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      console.log('Dropped in the same place');
      return;
    }

    // Find the task that was dragged
    // The draggableId might be a string representation of a number
    const task = tasks.find(t => String(t.id) === draggableId);
    if (!task) {
      console.error('Task not found:', draggableId);
      return;
    }

    console.log('Found task:', task);

    // Determine the new status based on the destination column
    let newStatus: TaskStatus;
    if (destination.droppableId === 'pending') {
      newStatus = 'pending';
    } else if (destination.droppableId === 'in_progress') {
      newStatus = 'in_progress';
    } else if (destination.droppableId === 'completed') {
      newStatus = 'completed';
    } else {
      console.error('Invalid destination:', destination.droppableId);
      return; // Invalid destination
    }

    console.log(`Changing status from ${task.status} to ${newStatus}`);

    // If status hasn't changed, no need to update
    if (newStatus === task.status) {
      console.log('Status unchanged, no update needed');
      return;
    }

    // Update the task locally first for immediate UI feedback
    const updatedTasks = tasks.map(t => 
      String(t.id) === draggableId ? { ...t, status: newStatus } : t
    );
    setTasks(updatedTasks);
    console.log('Updated local tasks');

    try {
      // Update the task on the server
      console.log(`Updating task ${task.id} status to ${newStatus}`);
      await TaskService.updateTask(task.id, { status: newStatus });
      console.log('Task status updated successfully');
    } catch (error) {
      console.error('Failed to update task status:', error);
      // Revert to original tasks if the update fails
      setTasks(initialTasks);
    }
  };

  return {
    tasks,
    pendingTasks,
    inProgressTasks,
    completedTasks,
    handleDragEnd
  };
}; 