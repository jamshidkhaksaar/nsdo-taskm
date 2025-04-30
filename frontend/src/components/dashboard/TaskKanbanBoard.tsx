import React from 'react';
import { Task, TaskStatus, User } from '../../types';
// import SyncIcon from '@mui/icons-material/Sync';
// import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
// import CancelIcon from '@mui/icons-material/Cancel';
// import HelpOutlineIcon from '@mui/icons-material/HelpOutline';

// const columns: { id: TaskStatus; title: string; icon: React.ComponentType<any> }[] = [
//   { id: TaskStatus.PENDING, title: 'Pending', icon: HelpOutlineIcon },
//   { id: TaskStatus.IN_PROGRESS, title: 'In Progress', icon: SyncIcon },
//   { id: TaskStatus.COMPLETED, title: 'Completed', icon: CheckCircleOutlineIcon },
//   { id: TaskStatus.CANCELLED, title: 'Cancelled', icon: CancelIcon },
// ];

// Define the props interface
interface TaskKanbanBoardProps {
  tasks: Task[];
  onTaskStatusChange: (taskId: string, newStatus: TaskStatus) => Promise<boolean>;
  onTaskClick: (task: Task) => void;
  loading: boolean;
  currentUser: User | null;
}

// Use the props interface in the component definition
const TaskKanbanBoard: React.FC<TaskKanbanBoardProps> = ({ 
  tasks, 
  onTaskStatusChange, 
  onTaskClick, 
  loading, 
  currentUser 
}) => {

  // Example of using props (replace placeholder div)
  // const tasksByStatus = useMemo(() => {
  //   return columns.reduce((acc, column) => {
  //     acc[column.id] = tasks.filter(task => task.status === column.id).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  //     return acc;
  //   }, {} as Record<TaskStatus, Task[]>);
  // }, [tasks]);

  if (loading) {
     return <div>Loading Kanban Board...</div>;
  }

  // Placeholder - Replace with actual Kanban board implementation using tasksByStatus, onTaskStatusChange, onTaskClick etc.
  return <div>Task Kanban Board - {tasks.length} tasks</div>;
};

export default TaskKanbanBoard;
