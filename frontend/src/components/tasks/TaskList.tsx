import React from 'react';
import { Task } from '../../types';
import { deleteTask } from '../../services/tasks.service'; // Import the deleteTask service
import { format, isPast } from 'date-fns'; // Import date-fns functions (removed parseISO)
import { useSelector } from 'react-redux'; // Import useSelector
import { selectAuthUser } from '../../store/slices/authSlice'; // Import the selector
import { TaskStatus } from '../../types'; // Import TaskStatus enum

interface TaskListProps {
  tasks: Task[];
  onEdit: (task: Task) => void;
  onDelete: () => void; // Callback to refresh list after deletion
}

const TaskList: React.FC<TaskListProps> = ({ tasks, onEdit, onDelete }) => {
  const currentUser = useSelector(selectAuthUser); // Get current user from store
  console.log('TaskList.tsx: Received tasks prop:', tasks);
  console.log('TaskList.tsx: Current user:', currentUser);

  const handleDelete = async (id: string) => { // Changed id type to string based on Task type
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
            <th className="text-left py-3 px-4 uppercase font-semibold text-sm">Status</th>
            <th className="text-left py-3 px-4 uppercase font-semibold text-sm">Priority</th>
            <th className="text-left py-3 px-4 uppercase font-semibold text-sm">Assignee</th>
            <th className="text-left py-3 px-4 uppercase font-semibold text-sm">Created By</th>
            <th className="text-left py-3 px-4 uppercase font-semibold text-sm">Due Date</th>
            <th className="text-left py-3 px-4 uppercase font-semibold text-sm">Actions</th>
          </tr>
        </thead>
        <tbody className="text-gray-700">
          {tasks.length === 0 ? (
            <tr>
              <td colSpan={7} className="text-center py-3 px-4">No tasks found.</td>
            </tr>
          ) : (
            tasks.map((task) => {
              console.log('TaskList.tsx: Processing task:', task);
              console.log('TaskList.tsx: Task createdBy:', task.createdBy);
              console.log('TaskList.tsx: Task assignedToUsers:', task.assignedToUsers);
              console.log('TaskList.tsx: Task assignedToUserIds:', task.assignedToUserIds);
              // Use new Date() to parse ISO string, check if dueDate exists
              const dueDateObj = task.dueDate ? new Date(task.dueDate) : null;
              const isOverdue = dueDateObj && isPast(dueDateObj) && task.status !== TaskStatus.COMPLETED && task.status !== TaskStatus.CANCELLED;
              const assigneeDisplay = task.assignedToUserIds?.includes(currentUser?.id ?? '')
                                        ? 'My Task'
                                        : task.assignedToUsers && task.assignedToUsers.length > 0
                                          ? task.assignedToUsers.map(u => u.username).join(', ') // Display usernames if available
                                          : task.assignedToDepartmentIds && task.assignedToDepartmentIds.length > 0
                                            ? 'Department Task' // Placeholder, ideally show department name
                                            : 'Unassigned';
              // TODO: Fetch and display department names if assignedToDepartmentIds is used.

              const creatorName = task.createdBy?.username || task.createdBy?.first_name || `User ${task.createdById.substring(0, 6)}...`; // Fallback to truncated ID

              // Assumption: Description is not needed in the main table view per user request.
              // Clicking task might show details later.
              return (
                <tr key={task.id} className="border-b hover:bg-gray-50">
                  <td className="text-left py-3 px-4">{task.title}</td>
                  <td className="text-left py-3 px-4">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      task.status === TaskStatus.COMPLETED ? 'bg-green-200 text-green-800' :
                      task.status === TaskStatus.IN_PROGRESS ? 'bg-yellow-200 text-yellow-800' :
                      task.status === TaskStatus.PENDING ? 'bg-blue-200 text-blue-800' : // Added pending style
                      task.status === TaskStatus.CANCELLED ? 'bg-gray-200 text-gray-800' : // Added cancelled style
                      'bg-red-200 text-red-800' // Default/fallback
                    }`}>
                      {task.status.replace('_', ' ').toUpperCase()} {/* Format status */}
                    </span>
                  </td>
                  <td className="text-left py-3 px-4">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                       task.priority === 'high' ? 'bg-red-200 text-red-800' :
                       task.priority === 'medium' ? 'bg-yellow-200 text-yellow-800' :
                       'bg-green-200 text-green-800' // low or others
                    }`}>
                      {task.priority.toUpperCase()}
                     </span>
                 </td>
                  <td className="text-left py-3 px-4">{assigneeDisplay}</td>
                  <td className="text-left py-3 px-4">{creatorName}</td>
                  <td className={`text-left py-3 px-4 ${isOverdue ? 'text-red-500 font-semibold' : ''}`}>
                    {/* Format the date object if it exists */}
                    {dueDateObj ? format(dueDateObj, 'dd-MMM-yyyy') : 'N/A'}
                  </td>
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
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};

export default TaskList; 