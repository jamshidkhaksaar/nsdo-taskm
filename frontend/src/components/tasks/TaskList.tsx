import React from 'react';
import { Task } from '../../types';
import { deleteTask } from '../../services/tasks.service'; // Import the deleteTask service

interface TaskListProps {
  tasks: Task[];
  onEdit: (task: Task) => void;
  onDelete: () => void; // Callback to refresh list after deletion
}

const TaskList: React.FC<TaskListProps> = ({ tasks, onEdit, onDelete }) => {

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await deleteTask(id);
        alert('Task deleted successfully');
        onDelete(); // Refresh the list in the parent component
      } catch (error) {
        console.error('Failed to delete task:', error);
        alert('Failed to delete task');
      }
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border border-gray-200">
        <thead>
          <tr className="bg-gray-100 border-b">
            <th className="text-left py-3 px-4 uppercase font-semibold text-sm">Title</th>
            <th className="text-left py-3 px-4 uppercase font-semibold text-sm">Description</th>
            <th className="text-left py-3 px-4 uppercase font-semibold text-sm">Status</th>
            {/* Add more headers if needed, e.g., Assignee, Department */}
            <th className="text-left py-3 px-4 uppercase font-semibold text-sm">Actions</th>
          </tr>
        </thead>
        <tbody className="text-gray-700">
          {tasks.length === 0 ? (
            <tr>
              <td colSpan={4} className="text-center py-3 px-4">No tasks found.</td>
            </tr>
          ) : (
            tasks.map((task) => (
              <tr key={task.id} className="border-b hover:bg-gray-50">
                <td className="text-left py-3 px-4">{task.title}</td>
                <td className="text-left py-3 px-4">{task.description}</td>
                <td className="text-left py-3 px-4">
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${
                    task.status === 'done' ? 'bg-green-200 text-green-800' :
                    task.status === 'in-progress' ? 'bg-yellow-200 text-yellow-800' :
                    'bg-red-200 text-red-800' // todo or others
                  }`}>
                    {task.status}
                  </span>
                </td>
                {/* Add more cells if needed */}
                <td className="text-left py-3 px-4">
                  <button
                    onClick={() => onEdit(task)}
                    className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-1 px-2 rounded text-xs mr-2"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(task.id)}
                    className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded text-xs"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default TaskList; 