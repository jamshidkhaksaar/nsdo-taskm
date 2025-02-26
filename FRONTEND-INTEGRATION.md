# Connecting React Frontend to NestJS Backend

This document explains how to connect the React frontend to the NestJS backend for the Task Management application.

## Backend API Endpoints

The NestJS backend provides the following API endpoints:

### Authentication

- `POST /api/auth/signup` - Register a new user
- `POST /api/auth/signin` - Login and get JWT token

### Tasks

- `GET /api/tasks` - Get all tasks for the authenticated user
- `GET /api/tasks/:id` - Get a specific task by ID
- `POST /api/tasks` - Create a new task
- `DELETE /api/tasks/:id` - Delete a task
- `PATCH /api/tasks/:id/status` - Update task status

## Frontend Integration

### 1. Install Axios

First, install Axios in your React project:

```bash
npm install axios
```

### 2. Create API Service

Create a service to handle API requests:

```jsx
// src/services/api.js
import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Auth services
export const authService = {
  signup: (username, email, password) => 
    api.post('/auth/signup', { username, email, password }),
  
  signin: (username, password) => 
    api.post('/auth/signin', { username, password })
    .then(response => {
      if (response.data.accessToken) {
        localStorage.setItem('token', response.data.accessToken);
      }
      return response.data;
    }),
  
  logout: () => {
    localStorage.removeItem('token');
  },
};

// Task services
export const taskService = {
  getAllTasks: () => 
    api.get('/tasks'),
  
  getTaskById: (id) => 
    api.get(`/tasks/${id}`),
  
  createTask: (title, description) => 
    api.post('/tasks', { title, description }),
  
  updateTaskStatus: (id, status) => 
    api.patch(`/tasks/${id}/status`, { status }),
  
  deleteTask: (id) => 
    api.delete(`/tasks/${id}`),
};

export default api;
```

### 3. Create Authentication Context

Create an authentication context to manage user state:

```jsx
// src/contexts/AuthContext.js
import React, { createContext, useState, useEffect, useContext } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (token) {
      // You might want to validate the token with the server
      setUser({ token });
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    try {
      const data = await authService.signin(username, password);
      setUser({ token: data.accessToken });
      return data;
    } catch (error) {
      throw error;
    }
  };

  const register = async (username, email, password) => {
    try {
      await authService.signup(username, email, password);
      return await login(username, password);
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
```

### 4. Create Task Context

Create a task context to manage tasks:

```jsx
// src/contexts/TaskContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import { taskService } from '../services/api';
import { useAuth } from './AuthContext';

const TaskContext = createContext();

export const TaskProvider = ({ children }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated } = useAuth();

  const fetchTasks = async () => {
    if (!isAuthenticated) return;
    
    try {
      setLoading(true);
      const response = await taskService.getAllTasks();
      setTasks(response.data);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [isAuthenticated]);

  const createTask = async (title, description) => {
    try {
      const response = await taskService.createTask(title, description);
      setTasks([...tasks, response.data]);
      return response.data;
    } catch (error) {
      console.error('Error creating task:', error);
      throw error;
    }
  };

  const updateTaskStatus = async (id, status) => {
    try {
      const response = await taskService.updateTaskStatus(id, status);
      setTasks(tasks.map(task => task.id === id ? response.data : task));
      return response.data;
    } catch (error) {
      console.error('Error updating task status:', error);
      throw error;
    }
  };

  const deleteTask = async (id) => {
    try {
      await taskService.deleteTask(id);
      setTasks(tasks.filter(task => task.id !== id));
    } catch (error) {
      console.error('Error deleting task:', error);
      throw error;
    }
  };

  return (
    <TaskContext.Provider
      value={{
        tasks,
        loading,
        fetchTasks,
        createTask,
        updateTaskStatus,
        deleteTask,
      }}
    >
      {children}
    </TaskContext.Provider>
  );
};

export const useTasks = () => useContext(TaskContext);
```

### 5. Wrap Your App with Providers

Wrap your app with the providers:

```jsx
// src/index.js or App.js
import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import { TaskProvider } from './contexts/TaskContext';

ReactDOM.render(
  <React.StrictMode>
    <AuthProvider>
      <TaskProvider>
        <App />
      </TaskProvider>
    </AuthProvider>
  </React.StrictMode>,
  document.getElementById('root')
);
```

### 6. Use the Contexts in Components

Now you can use the contexts in your components:

```jsx
// Example Login Component
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(username, password);
      // Redirect or show success message
    } catch (err) {
      setError('Invalid credentials');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Login</h2>
      {error && <p className="error">{error}</p>}
      <div>
        <label>Username</label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
      </div>
      <div>
        <label>Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      <button type="submit">Login</button>
    </form>
  );
};

export default Login;
```

```jsx
// Example Tasks Component
import React, { useState } from 'react';
import { useTasks } from '../contexts/TaskContext';
import { TaskStatus } from '../constants';

const Tasks = () => {
  const { tasks, loading, createTask, updateTaskStatus, deleteTask } = useTasks();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createTask(title, description);
      setTitle('');
      setDescription('');
    } catch (err) {
      console.error('Error creating task:', err);
    }
  };

  if (loading) {
    return <div>Loading tasks...</div>;
  }

  return (
    <div>
      <h2>Tasks</h2>
      
      <form onSubmit={handleSubmit}>
        <h3>Add New Task</h3>
        <div>
          <label>Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <button type="submit">Add Task</button>
      </form>
      
      <div className="tasks-list">
        {tasks.length === 0 ? (
          <p>No tasks found. Create one!</p>
        ) : (
          tasks.map((task) => (
            <div key={task.id} className="task-item">
              <h4>{task.title}</h4>
              <p>{task.description}</p>
              <div>
                <select
                  value={task.status}
                  onChange={(e) => updateTaskStatus(task.id, e.target.value)}
                >
                  <option value={TaskStatus.TODO}>To Do</option>
                  <option value={TaskStatus.IN_PROGRESS}>In Progress</option>
                  <option value={TaskStatus.DONE}>Done</option>
                </select>
                <button onClick={() => deleteTask(task.id)}>Delete</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Tasks;
```

## Constants

Create a constants file for task statuses:

```jsx
// src/constants.js
export const TaskStatus = {
  TODO: 'TODO',
  IN_PROGRESS: 'IN_PROGRESS',
  DONE: 'DONE',
};
```

## Protected Routes

Create protected routes to restrict access to authenticated users:

```jsx
// src/components/ProtectedRoute.js
import React from 'react';
import { Route, Redirect } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ component: Component, ...rest }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Route
      {...rest}
      render={(props) =>
        isAuthenticated ? (
          <Component {...props} />
        ) : (
          <Redirect to="/login" />
        )
      }
    />
  );
};

export default ProtectedRoute;
```

Use it in your routes:

```jsx
// src/App.js
import React from 'react';
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './components/Login';
import Register from './components/Register';
import Tasks from './components/Tasks';
import Navbar from './components/Navbar';

const App = () => {
  return (
    <Router>
      <Navbar />
      <div className="container">
        <Switch>
          <Route path="/login" component={Login} />
          <Route path="/register" component={Register} />
          <ProtectedRoute path="/tasks" component={Tasks} />
          <ProtectedRoute path="/" exact component={Tasks} />
        </Switch>
      </div>
    </Router>
  );
};

export default App;
```

## Conclusion

This integration connects your React frontend to the NestJS backend. The frontend uses Axios for API requests, and React Context for state management. Protected routes ensure that only authenticated users can access certain pages. 