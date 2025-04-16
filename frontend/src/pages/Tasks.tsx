import React, { useState, useEffect } from 'react';
import TaskList from '../components/tasks/TaskList';
import TaskForm from '../components/tasks/TaskForm';
import { Task } from '../types';
import { getTasks } from '../services/tasks.service'; // Ensure this service exists

const Tasks: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);

  const fetchTasks = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getTasks(); // Fetch tasks from the API
      console.log('Tasks.tsx: Data received from getTasks:', data);
      setTasks(data);
    } catch (err) {
      setError('Failed to fetch tasks');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleEdit = (task: Task) => {
    setSelectedTask(task);
    setIsFormOpen(true);
  };

  const handleAdd = () => {
    setSelectedTask(null); // Ensure no task is selected for adding
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setSelectedTask(null); // Clear selected task on close
  };

  const handleFormSuccess = () => {
    fetchTasks(); // Refresh the list after add/edit
    handleCloseForm(); // Close the form
  };

  const handleDeletionSuccess = () => {
    fetchTasks(); // Refresh the list after delete
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Tasks</h1>
      {loading && <p>Loading tasks...</p>}
      {error && <p className="text-red-500">{error}</p>}
      {!loading && !error && (
        <>
          <button
            onClick={handleAdd}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mb-4"
          >
            Add New Task
          </button>
          <TaskList
            tasks={tasks}
            onEdit={handleEdit}
            onDelete={handleDeletionSuccess} // Pass the refresh handler
          />
        </>
      )}
      {isFormOpen && (
        <TaskForm
          task={selectedTask}
          onClose={handleCloseForm}
          onSuccess={handleFormSuccess}
        />
      )}
    </div>
  );
};

export default Tasks; 