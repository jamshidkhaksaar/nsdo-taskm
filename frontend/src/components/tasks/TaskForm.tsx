import React, { useState, useEffect } from 'react';
// Import from the consolidated index file
import { Task, TaskStatus, TaskPriority, TaskType, CreateTask, TaskUpdate } from '../../types/index';
// Assuming addTask/updateTask service functions expect types defined in index.ts
import { addTask, updateTask } from '../../services/tasks.service';
// Import User and Department if needed for assignment dropdowns
// import { User, Department } from '../../types/index';

interface TaskFormProps {
  task: Task | null;
  onClose: () => void;
  onSuccess: () => void;
}

const TaskForm: React.FC<TaskFormProps> = ({ task, onClose, onSuccess }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  // Use TaskStatus from index.ts (e.g., PENDING)
  const [status, setStatus] = useState<TaskStatus>(TaskStatus.PENDING);
  // Use TaskPriority from index.ts (e.g., MEDIUM)
  const [priority, setPriority] = useState<TaskPriority>(TaskPriority.MEDIUM);
  const [dueDate, setDueDate] = useState<string | null>(null);
  // Use TaskType from index.ts (e.g., PERSONAL)
  const [type, setType] = useState<TaskType>(TaskType.PERSONAL);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // Add state for assignees if needed by the form
  // const [assignedToUserIds, setAssignedToUserIds] = useState<string[]>([]);
  // const [assignedToDepartmentIds, setAssignedToDepartmentIds] = useState<string[]>([]);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description);
      setStatus(task.status);
      setPriority(task.priority);
      setDueDate(task.dueDate ? task.dueDate.split('T')[0] : null); // Keep date format
      setType(task.type);
      // Set assignee IDs if editing
      // setAssignedToUserIds(task.assignedToUserIds || []);
      // setAssignedToDepartmentIds(task.assignedToDepartmentIds || []);
    } else {
      // Reset form
      setTitle('');
      setDescription('');
      setStatus(TaskStatus.PENDING);
      setPriority(TaskPriority.MEDIUM);
      setDueDate(null);
      setType(TaskType.PERSONAL);
      // Reset assignees
      // setAssignedToUserIds([]);
      // setAssignedToDepartmentIds([]);
    }
    // ... fetch dropdown data ...
  }, [task]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formattedDueDate = dueDate ? new Date(dueDate).toISOString() : null;

    // Construct payload based on CreateTask or TaskUpdate type
    const commonPayload = {
      title,
      description,
      status,
      priority,
      type,
      dueDate: formattedDueDate,
      // Add assignment fields if handled by form
      // assignedToUserIds,
      // assignedToDepartmentIds,
    };

    try {
      if (task) {
        // Type assertion for TaskUpdate
        const updatePayload: TaskUpdate = commonPayload;
        await updateTask(task.id, updatePayload); // task.id is already string
        alert('Task updated successfully');
      } else {
        // Type assertion for CreateTask
        const createPayload: CreateTask & { createdById: string } = {
          ...commonPayload,
          type: type,
          // Add createdById to satisfy the type expected by addTask
          createdById: '', // Assuming backend handles this or user ID should be fetched
          // Add other required fields from CreateTask if any
        };
        // Cast to the type expected by the service function
        await addTask(createPayload as Omit<Task, "id" | "createdAt" | "updatedAt">);
        alert('Task added successfully');
      }
      onSuccess();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(task ? `Failed to update task: ${message}` : `Failed to add task: ${message}`);
      console.error(err);
      alert(error);
    } finally {
      setLoading(false);
    }
  };

  return (
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
              onChange={(e) => setStatus(e.target.value as TaskStatus)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              {/* Use enum members from index.ts */}
              <option value={TaskStatus.PENDING}>Pending</option>
              <option value={TaskStatus.IN_PROGRESS}>In Progress</option>
              <option value={TaskStatus.COMPLETED}>Completed</option>
              <option value={TaskStatus.CANCELLED}>Cancelled</option>
            </select>
          </div>

          <div className="mb-4">
            <label htmlFor="priority" className="block text-sm font-medium text-gray-700">Priority</label>
            <select
              id="priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value as TaskPriority)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              {/* Use enum members from index.ts */}
              <option value={TaskPriority.LOW}>Low</option>
              <option value={TaskPriority.MEDIUM}>Medium</option>
              <option value={TaskPriority.HIGH}>High</option>
            </select>
          </div>

          <div className="mb-4">
            <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700">Due Date</label>
            <input
              type="date"
              id="dueDate"
              value={dueDate || ''}
              onChange={(e) => setDueDate(e.target.value || null)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>

          <div className="mb-4">
            <label htmlFor="type" className="block text-sm font-medium text-gray-700">Type</label>
            <select
              id="type"
              value={type}
              onChange={(e) => setType(e.target.value as TaskType)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              {/* Use enum members from index.ts */}
              <option value={TaskType.PERSONAL}>Personal</option>
              <option value={TaskType.DEPARTMENT}>Department</option>
              <option value={TaskType.USER}>User Assigned</option>
              <option value={TaskType.PROVINCE_DEPARTMENT}>Province Department</option>
            </select>
          </div>

          {/* Add assignee selection fields here if needed */}

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