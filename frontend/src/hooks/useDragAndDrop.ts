import { useState, useEffect, useCallback } from 'react';
import { Task, TaskStatus } from '../types/task';
import { TaskService } from '../services/task';
import { DropResult } from 'react-beautiful-dnd';

export const useDragAndDrop = (initialTasks: Task[]) => {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({});

  // Update tasks when initialTasks change
  useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  // Group tasks by status
  const pendingTasks = tasks.filter(task => task.status === 'pending');
  const inProgressTasks = tasks.filter(task => task.status === 'in_progress');
  const completedTasks = tasks.filter(task => task.status === 'completed');

  // Handle drag end
  const handleDragEnd = useCallback(async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    // If dropped outside a droppable area
    if (!destination) {
      return;
    }

    // If dropped in the same place
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    // Find the task that was dragged
    const task = tasks.find(t => String(t.id) === draggableId);
    if (!task) {
      console.error('Task not found:', draggableId);
      return;
    }

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

    // If status hasn't changed, no need to update
    if (newStatus === task.status) {
      return;
    }

    // Set loading state for this task
    setIsLoading(prev => ({ ...prev, [task.id]: true }));

    // Update the task locally first for immediate UI feedback
    const updatedTasks = tasks.map(t => 
      String(t.id) === draggableId ? { ...t, status: newStatus } : t
    );
    setTasks(updatedTasks);

    try {
      // Update the task on the server
      await TaskService.updateTask(task.id, { status: newStatus });
    } catch (error) {
      console.error('Failed to update task status:', error);
      // Revert to original tasks if the update fails
      setTasks(tasks);
    } finally {
      // Clear loading state
      setIsLoading(prev => ({ ...prev, [task.id]: false }));
    }
  }, [tasks]);

  // Reorder tasks within the same column
  const reorderTasks = useCallback((list: Task[], startIndex: number, endIndex: number): Task[] => {
    const result = Array.from(list);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);
    return result;
  }, []);

  // Move a task from one column to another
  const moveBetweenColumns = useCallback((
    source: Task[],
    destination: Task[],
    sourceIndex: number,
    destIndex: number,
    newStatus: TaskStatus
  ): { sourceList: Task[], destinationList: Task[] } => {
    const sourceClone = Array.from(source);
    const destClone = Array.from(destination);
    const [removed] = sourceClone.splice(sourceIndex, 1);
    
    // Update the task's status
    const updatedTask = { ...removed, status: newStatus };
    
    destClone.splice(destIndex, 0, updatedTask);
    
    return { sourceList: sourceClone, destinationList: destClone };
  }, []);

  return {
    tasks,
    pendingTasks,
    inProgressTasks,
    completedTasks,
    handleDragEnd,
    isLoading
  };
}; 