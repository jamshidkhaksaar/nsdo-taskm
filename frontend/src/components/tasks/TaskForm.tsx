import React, { useState, useEffect } from 'react';
import { Task } from '../../types';
import { addTask, updateTask } from '../../services/tasks.service';
// Import services to fetch users and departments if needed for dropdowns
// import { getUsers } from '../../services/users.service';
// import { getDepartments } from '../../services/departments.service';
// import { User, Department } from '../../types';

interface TaskFormProps {
  task: Task | null; // null for add mode, Task object for edit mode
  onClose: () => void;
  onSuccess: () => void; // Callback after successful add/edit
}

const TaskForm: React.FC<TaskFormProps> = ({ task, onClose, onSuccess }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'todo' | 'in-progress' | 'done'>('todo');
  const [userId, setUserId] = useState<number | null>(null);
  const [departmentId, setDepartmentId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // State for dropdown data - uncomment and implement fetching later
  // const [users, setUsers] = useState<User[]>([]);
  // const [departments, setDepartments] = useState<Department[]>([]);

  useEffect(() => {
    if (task) {
      // Pre-fill form for edit mode
      setTitle(task.title);
      setDescription(task.description);
      setStatus(task.status);
      setUserId(task.userId);
      setDepartmentId(task.departmentId);
    } else {
      // Reset form for add mode
      setTitle('');
      setDescription('');
      setStatus('todo');
      setUserId(null);
      setDepartmentId(null);
    }

    // Fetch data for dropdowns - uncomment and implement later
    // const fetchData = async () => {
    //   try {
    //     // const usersData = await getUsers();
    //     // const departmentsData = await getDepartments();
    //     // setUsers(usersData);
    //     // setDepartments(departmentsData);
    //   } catch (err) {
    //     console.error("Failed to fetch users/departments for form", err);
    //     // Handle error fetching dropdown data
    //   }
    // };
    // fetchData();

  }, [task]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const taskData = { title, description, status, userId, departmentId };

    try {
      if (task) {
        // Edit mode
        await updateTask(task.id, taskData);
        alert('Task updated successfully');
      } else {
        // Add mode
        await addTask(taskData);
        alert('Task added successfully');
      }
      onSuccess(); // Trigger refresh and close form in parent
    } catch (err) {
      setError(task ? 'Failed to update task' : 'Failed to add task');
      console.error(err);
      alert(error); // Show error alert
    } finally {
      setLoading(false);
    }
  };

  return (
    // Basic modal structure - consider using a dedicated modal component library
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex justify-center items-center">
      <div className="relative mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
        <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
          {task ? 'Edit Task' : 'Add New Task'}
        </h3>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">Title</label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              required
            />
          </div>
          <div className="mb-4">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              required
            />
          </div>
          <div className="mb-4">
            <label htmlFor="status" className="block text-sm font-medium text-gray-700">Status</label>
            <select
              id="status"
              value={status}
              onChange={(e) => setStatus(e.target.value as 'todo' | 'in-progress' | 'done')}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              <option value="todo">To Do</option>
              <option value="in-progress">In Progress</option>
              <option value="done">Done</option>
            </select>
          </div>

          {/* Placeholder for User Assignee Dropdown */}
          {/* <div className="mb-4">
             <label htmlFor="userId" className="block text-sm font-medium text-gray-700">Assignee</label>
             <select id="userId" value={userId ?? ''} onChange={(e) => setUserId(e.target.value ? parseInt(e.target.value) : null)} className="...">
               <option value="">Unassigned</option>
               {users.map(user => <option key={user.id} value={user.id}>{user.name}</option>)} // Need User type with name
             </select>
           </div> */}

          {/* Placeholder for Department Dropdown */}
          {/* <div className="mb-4">
             <label htmlFor="departmentId" className="block text-sm font-medium text-gray-700">Department</label>
             <select id="departmentId" value={departmentId ?? ''} onChange={(e) => setDepartmentId(e.target.value ? parseInt(e.target.value) : null)} className="...">
               <option value="">None</option>
               {departments.map(dept => <option key={dept.id} value={dept.id}>{dept.name}</option>)}
             </select>
           </div> */}

          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? 'Saving...' : (task ? 'Update Task' : 'Add Task')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskForm; 