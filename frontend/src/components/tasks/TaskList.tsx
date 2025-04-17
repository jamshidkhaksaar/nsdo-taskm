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
              // --- UNCOMMENT ORIGINAL RENDER LOGIC ---
              // Log data for each task being processed
              // console.log(`[TaskList] Processing Task ID: ${task.id}`, task);
              // console.log(`[TaskList] Task ${task.id} - assignedToUsers:`, task.assignedToUsers);
              // console.log(`[TaskList] Task ${task.id} - createdBy:`, task.createdBy);
              // console.log(`[TaskList] Task ${task.id} - assignedToUserIds:`, task.assignedToUserIds);
              
              // Use new Date() to parse ISO string, check if dueDate exists
              const dueDateObj = task.dueDate ? new Date(task.dueDate) : null;
              const isOverdue = dueDateObj && isPast(dueDateObj) && task.status !== TaskStatus.COMPLETED && task.status !== TaskStatus.CANCELLED;
              
              // --- REVISED ASSIGNEE LOGIC ---
              const isCreatedByCurrentUser = task.createdById === currentUser?.id;
              const isAssignedToCurrentUser = task.assignedToUsers?.some(user => user.id === currentUser?.id);
              const hasOtherAssignees = task.assignedToUsers && task.assignedToUsers.length > 0;
              const isAssignedToDepartment = task.assignedToDepartmentIds && task.assignedToDepartmentIds.length > 0;
              const isUnassigned = !hasOtherAssignees && !isAssignedToDepartment;

              let assigneeDisplay = 'Unassigned'; // Default

              if (isAssignedToCurrentUser) {
                  // If assigned to current user, show their name
                  assigneeDisplay = currentUser?.username || 'MY TASKS'; 
              } else if (isCreatedByCurrentUser && isUnassigned) {
                  // If created by current user AND unassigned to anyone
                  assigneeDisplay = 'MY TASKS';
              } else if (hasOtherAssignees) {
                  // If assigned to other users (but not current user)
                  assigneeDisplay = task.assignedToUsers?.map(u => u.username).join(', ') || 'Error Assignee';
              } else if (isAssignedToDepartment) {
                  // If assigned to a department (and not specific users)
                  assigneeDisplay = 'Department Task';
              }
              // --------------------------------

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
                      {task.status.replace('_', ' ').toUpperCase()} 
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
             // --- END ORIGINAL RENDER LOGIC --- 
            })
          )}
        </tbody>
      </table>
    </div>
  );
};

export default TaskList; 