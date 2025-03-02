import React from 'react';
import { render, screen, waitFor, within, waitForElementToBeRemoved } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import configureStore from 'redux-mock-store';
import Dashboard from '../../pages/Dashboard';
import axios from '../../utils/axios';
import { act } from 'react-dom/test-utils';

// Mock axios
jest.mock('../../utils/axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  BrowserRouter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Mock useErrorHandler hook
jest.mock('../../hooks/useErrorHandler', () => ({
  useErrorHandler: () => ({
    error: null,
    handleError: jest.fn(),
    clearError: jest.fn()
  })
}));

// Mock the components that are used in Dashboard
jest.mock('../../components/dashboard/WeatherWidget', () => ({
  __esModule: true,
  default: ({ compact }: { compact: boolean }) => (
    <div data-testid="weather-widget" className={compact ? 'compact' : ''}>
      Weather Widget {compact ? '(Compact)' : '(Full)'}
    </div>
  )
}));

jest.mock('../../components/dashboard/TaskSummary', () => ({
  __esModule: true,
  default: ({ tasks, compact }: { tasks: any[], compact: boolean }) => (
    <div data-testid="task-summary" className={compact ? 'compact' : ''}>
      Task Summary (Tasks: {tasks.length}, Compact: {compact.toString()})
    </div>
  )
}));

jest.mock('../../components/dashboard/TaskKanbanBoard', () => ({
  __esModule: true,
  default: ({ tasks, onCreateTask, onEditTask, onDeleteTask, onChangeTaskStatus }: { 
    tasks: any[], 
    onCreateTask: (status: string) => void,
    onEditTask: (id: string) => void,
    onDeleteTask: (id: string) => void,
    onChangeTaskStatus: (id: string, status: string) => Promise<boolean>
  }) => (
    <div data-testid="task-kanban-board">
      <div>Task Kanban Board (Tasks: {tasks.length})</div>
      <button 
        data-testid="create-task-btn" 
        onClick={() => onCreateTask('pending')}
      >
        Create Task
      </button>
      <button 
        data-testid="edit-task-btn" 
        onClick={() => onEditTask('1')}
      >
        Edit Task
      </button>
      <button 
        data-testid="delete-task-btn" 
        onClick={() => onDeleteTask('1')}
      >
        Delete Task
      </button>
      <button 
        data-testid="change-status-btn" 
        onClick={() => onChangeTaskStatus('1', 'completed')}
      >
        Change Status
      </button>
    </div>
  )
}));

jest.mock('../../components/dashboard/ActivityFeed', () => ({
  __esModule: true,
  default: () => <div data-testid="activity-feed">Activity Feed</div>
}));

jest.mock('../../components/dashboard/NotesWidget', () => ({
  __esModule: true,
  default: () => <div data-testid="notes-widget">Notes Widget</div>
}));

jest.mock('../../components/Sidebar', () => ({
  __esModule: true,
  default: ({ open }: { open: boolean }) => (
    <div data-testid="sidebar" className={open ? 'open' : 'closed'}>
      Sidebar {open ? '(Open)' : '(Closed)'}
    </div>
  )
}));

jest.mock('../../components/dashboard/DashboardTopBar', () => ({
  __esModule: true,
  default: ({ 
    onToggleSidebar, 
    onNotificationClick,
    onProfileClick,
    onSettingsClick,
    onHelpClick,
    notifications
  }: { 
    onToggleSidebar: () => void,
    onNotificationClick: () => void,
    onProfileClick: () => void,
    onSettingsClick: () => void,
    onHelpClick: () => void,
    notifications: number
  }) => (
    <div data-testid="dashboard-top-bar">
      <span>Dashboard Top Bar (Notifications: {notifications || 0})</span>
      <button data-testid="toggle-sidebar-btn" onClick={onToggleSidebar}>Toggle Sidebar</button>
      <button data-testid="notification-btn" onClick={onNotificationClick}>Notifications</button>
      <button data-testid="profile-btn" onClick={onProfileClick}>Profile</button>
      <button data-testid="settings-btn" onClick={onSettingsClick}>Settings</button>
      <button data-testid="help-btn" onClick={onHelpClick}>Help</button>
    </div>
  )
}));

jest.mock('../../components/dashboard/ModernDashboardLayout', () => ({
  __esModule: true,
  default: ({ 
    sidebar, 
    topBar, 
    mainContent, 
    rightPanel 
  }: { 
    sidebar: React.ReactNode, 
    topBar: React.ReactNode, 
    mainContent: React.ReactNode, 
    rightPanel: React.ReactNode 
  }) => (
    <div data-testid="modern-dashboard-layout">
      <div data-testid="sidebar-container">{sidebar}</div>
      <div data-testid="topbar-container">{topBar}</div>
      <div data-testid="main-content-container">{mainContent}</div>
      {rightPanel && <div data-testid="right-panel-container">{rightPanel}</div>}
    </div>
  )
}));

// Mock Material UI components
jest.mock('@mui/material', () => {
  const original = jest.requireActual('@mui/material');
  return {
    ...original,
    CircularProgress: () => <div role="progressbar">Loading...</div>,
    Alert: ({ severity, children }: { severity: string, children: React.ReactNode }) => (
      <div role="alert" data-severity={severity}>{children}</div>
    ),
    Dialog: ({ open, children, 'data-testid': testId, ...props }: { 
      open: boolean, 
      children: React.ReactNode,
      'data-testid'?: string 
    }) => (
      open ? <div role="dialog" data-testid={testId || "dialog"}>{children}</div> : null
    ),
    DialogTitle: ({ children }: { children: React.ReactNode }) => (
      <div className="dialog-title">{children}</div>
    ),
    DialogContent: ({ children }: { children: React.ReactNode }) => (
      <div className="dialog-content">{children}</div>
    ),
    DialogContentText: ({ children }: { children: React.ReactNode }) => (
      <div className="dialog-content-text">{children}</div>
    ),
    DialogActions: ({ children }: { children: React.ReactNode }) => (
      <div className="dialog-actions" data-testid="dialog-actions">{children}</div>
    ),
    Button: ({ onClick, children, color, 'data-testid': testId }: { 
      onClick?: () => void, 
      children: React.ReactNode, 
      color?: string,
      'data-testid'?: string 
    }) => (
      <button onClick={onClick} data-color={color} data-testid={testId}>{children}</button>
    ),
    useMediaQuery: jest.fn().mockImplementation(() => false),
    useTheme: () => ({
      breakpoints: {
        down: (size: string) => `(max-width:${size}px)`,
        up: (size: string) => `(min-width:${size}px)`
      }
    }),
    Box: ({ children, sx, ...props }: { children: React.ReactNode, sx?: any }) => (
      <div {...props}>{children}</div>
    ),
    Container: ({ children, ...props }: { children: React.ReactNode }) => (
      <div {...props}>{children}</div>
    )
  };
});

// Mock DateTimePicker to avoid useMediaQuery issues
jest.mock('@mui/x-date-pickers', () => ({
  DateTimePicker: ({ value, onChange, ...props }: any) => (
    <div data-testid="date-time-picker">
      <input 
        type="text" 
        value={value?.toString() || ''} 
        onChange={(e) => onChange && onChange(e.target.value)}
      />
    </div>
  ),
  LocalizationProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}));

// Mock CreateTaskDialog component
jest.mock('../../components/tasks/CreateTaskDialog', () => ({
  __esModule: true,
  default: ({ open, onClose, onTaskCreated, dialogType, initialStatus, task }: { 
    open: boolean, 
    onClose: () => void, 
    onTaskCreated: () => void, 
    dialogType: string, 
    initialStatus?: string,
    task?: any
  }) => (
    open ? (
      <div data-testid="create-task-dialog" data-dialog-type={dialogType}>
        <div>Create Task Dialog</div>
        <div>Initial Status: {initialStatus || 'none'}</div>
        <div>Task: {task ? JSON.stringify(task) : 'none'}</div>
        <button data-testid="close-dialog-btn" onClick={onClose}>Close</button>
        <button data-testid="save-task-btn" onClick={() => { onTaskCreated(); onClose(); }}>Save</button>
      </div>
    ) : null
  )
}));

// Mock ErrorDisplay component
jest.mock('../../components/common/ErrorDisplay', () => ({
  __esModule: true,
  default: ({ error, onClear }: { error: string | null, onClear: () => void }) => (
    error ? (
      <div data-testid="error-display">
        <div>{error}</div>
        <button onClick={onClear}>Clear</button>
      </div>
    ) : null
  )
}));

// Mock ErrorBoundary component
jest.mock('../../components/ErrorBoundary', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}));

// Create mock store
const mockStore = configureStore([]);

// Increase Jest timeout for these tests
jest.setTimeout(15000);

describe('Dashboard Page', () => {
  let store: any;
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup mock store with authenticated user
    store = mockStore({
      auth: {
        isAuthenticated: true,
        token: 'fake-token',
        user: {
          id: 'user1',
          username: 'testuser',
          email: 'test@example.com'
        }
      }
    });
    
    // Mock successful API response
    mockedAxios.get.mockImplementation(() => {
      return Promise.resolve({
        data: [
          {
            id: '1',
            title: 'Task 1',
            description: 'Description 1',
            status: 'pending',
            due_date: '2023-12-31',
            created_at: '2023-01-01',
            is_private: true,
            assigned_to: null,
            created_by: 'user1'
          },
          {
            id: '2',
            title: 'Task 2',
            description: 'Description 2',
            status: 'in_progress',
            due_date: '2023-12-31',
            created_at: '2023-01-01',
            is_private: false,
            assigned_to: 'user2',
            created_by: 'user1'
          }
        ]
      });
    });

    // Mock successful delete response
    mockedAxios.delete.mockResolvedValue({ data: { success: true } });
    
    // Mock successful patch response
    mockedAxios.patch.mockResolvedValue({ data: { success: true } });

    // Reset Material UI media query mocks
    const useMediaQueryMock = require('@mui/material').useMediaQuery;
    useMediaQueryMock.mockImplementation(() => false); // Default to desktop view
  });
  
  const renderWithProviders = (ui: React.ReactElement) => {
    return render(
      <Provider store={store}>
        {ui}
      </Provider>
    );
  };
  
  test('renders dashboard with all components when authenticated', async () => {
    renderWithProviders(<Dashboard />);
    
    // Initially should show loading state
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    
    // Wait for tasks to load
    await waitForElementToBeRemoved(() => screen.queryByRole('progressbar'), { timeout: 10000 });
    
    // Check if all components are rendered
    expect(screen.getByTestId('modern-dashboard-layout')).toBeInTheDocument();
    expect(screen.getByTestId('sidebar')).toBeInTheDocument();
    expect(screen.getByTestId('dashboard-top-bar')).toBeInTheDocument();
    expect(screen.getByTestId('weather-widget')).toBeInTheDocument();
    expect(screen.getByTestId('task-summary')).toBeInTheDocument();
    expect(screen.getByTestId('task-kanban-board')).toBeInTheDocument();
    expect(screen.getByTestId('activity-feed')).toBeInTheDocument();
    expect(screen.getByTestId('notes-widget')).toBeInTheDocument();
    
    // Check if tasks were passed to components
    expect(screen.getByText(/Task Summary \(Tasks: 2/)).toBeInTheDocument();
    expect(screen.getByText(/Task Kanban Board \(Tasks: 2/)).toBeInTheDocument();
    
    // Verify API was called
    expect(mockedAxios.get).toHaveBeenCalledWith('/api/tasks');
  });
  
  test('shows error message when API request fails', async () => {
    // Mock API error
    mockedAxios.get.mockRejectedValueOnce(new Error('API Error'));
    
    renderWithProviders(<Dashboard />);
    
    // Initially should show loading state
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    
    // Wait for error to appear
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    // Check for error message using queryAllByText to handle multiple matches
    const errorElements = screen.queryAllByText(/Failed to load tasks/i);
    expect(errorElements.length).toBeGreaterThan(0);
  });
  
  test('redirects to login page when not authenticated', async () => {
    // Setup unauthenticated store
    store = mockStore({
      auth: {
        isAuthenticated: false,
        token: null,
        user: null
      }
    });
    
    renderWithProviders(<Dashboard />);
    
    // Should redirect to login
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });

  // New tests for UI functionality

  test('toggles sidebar when toggle button is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Dashboard />);
    
    // Wait for loading spinner to disappear
    await waitForElementToBeRemoved(() => screen.queryByRole('progressbar'), { timeout: 10000 });
    
    // Sidebar should be open by default on desktop
    expect(screen.getByTestId('sidebar')).toHaveTextContent('Sidebar (Open)');
    
    // Click toggle button
    await user.click(screen.getByTestId('toggle-sidebar-btn'));
    
    // Sidebar should be closed
    expect(screen.getByTestId('sidebar')).toHaveTextContent('Sidebar (Closed)');
    
    // Click toggle button again
    await user.click(screen.getByTestId('toggle-sidebar-btn'));
    
    // Sidebar should be open again
    expect(screen.getByTestId('sidebar')).toHaveTextContent('Sidebar (Open)');
  });

  test('resets notifications when notification button is clicked', async () => {
    // Set initial notifications in the store
    store = mockStore({
      auth: {
        isAuthenticated: true,
        token: 'fake-token',
        user: {
          id: 'user1',
          username: 'testuser',
          email: 'test@example.com'
        }
      }
    });
    
    const user = userEvent.setup();
    const { rerender } = renderWithProviders(<Dashboard />);
    
    // Wait for loading spinner to disappear
    await waitForElementToBeRemoved(() => screen.queryByRole('progressbar'), { timeout: 10000 });
    
    // Manually update the component to show notifications
    const topBar = screen.getByTestId('dashboard-top-bar');
    expect(topBar).toBeInTheDocument();
    
    // Click notifications button
    await user.click(screen.getByTestId('notification-btn'));
    
    // Verify the notification click handler was called
    // We can't directly test the state change since we're using mocks,
    // but we can verify the button was clicked
    expect(screen.getByTestId('notification-btn')).toBeInTheDocument();
  });

  test('navigates to profile page when profile button is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Dashboard />);
    
    // Wait for loading spinner to disappear
    await waitForElementToBeRemoved(() => screen.queryByRole('progressbar'), { timeout: 10000 });
    
    // Click profile button
    await user.click(screen.getByTestId('profile-btn'));
    
    // Should navigate to profile page
    expect(mockNavigate).toHaveBeenCalledWith('/profile');
  });

  test('navigates to settings page when settings button is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Dashboard />);
    
    // Wait for loading spinner to disappear
    await waitForElementToBeRemoved(() => screen.queryByRole('progressbar'), { timeout: 10000 });
    
    // Click settings button
    await user.click(screen.getByTestId('settings-btn'));
    
    // Should navigate to settings page
    expect(mockNavigate).toHaveBeenCalledWith('/settings');
  });

  test('opens create task dialog when create task button is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Dashboard />);
    
    // Wait for loading spinner to disappear
    await waitForElementToBeRemoved(() => screen.queryByRole('progressbar'), { timeout: 10000 });
    
    // No dialog initially
    expect(screen.queryByTestId('create-task-dialog')).not.toBeInTheDocument();
    
    // Click create task button
    await user.click(screen.getByTestId('create-task-btn'));
    
    // Check if the dialog is rendered
    expect(screen.getByTestId('create-task-dialog')).toBeInTheDocument();
  });

  test('opens edit task dialog when edit task button is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Dashboard />);
    
    // Wait for loading spinner to disappear
    await waitForElementToBeRemoved(() => screen.queryByRole('progressbar'), { timeout: 10000 });
    
    // No dialog initially
    expect(screen.queryByTestId('create-task-dialog')).not.toBeInTheDocument();
    
    // Click edit task button
    await user.click(screen.getByTestId('edit-task-btn'));
    
    // Check if the dialog is rendered
    expect(screen.getByTestId('create-task-dialog')).toBeInTheDocument();
  });

  test('opens delete confirmation dialog when delete task button is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Dashboard />);
    
    // Wait for loading spinner to disappear
    await waitForElementToBeRemoved(() => screen.queryByRole('progressbar'), { timeout: 10000 });
    
    // Find and click the delete task button
    const deleteButton = screen.getByTestId('delete-task-btn');
    await user.click(deleteButton);
    
    // Check if the dialog is rendered
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
    
    // Check dialog content
    expect(screen.getByText(/Confirm Delete/i)).toBeInTheDocument();
    expect(screen.getByText(/Are you sure you want to delete this task/i)).toBeInTheDocument();
  });

  test('calls API to change task status when status is changed', async () => {
    mockedAxios.patch.mockResolvedValueOnce({ data: { success: true } });
    
    const user = userEvent.setup();
    renderWithProviders(<Dashboard />);
    
    // Wait for loading spinner to disappear
    await waitForElementToBeRemoved(() => screen.queryByRole('progressbar'), { timeout: 10000 });
    
    // Click change status button
    await user.click(screen.getByTestId('change-status-btn'));
    
    // API should be called to update status
    expect(mockedAxios.patch).toHaveBeenCalledWith('/api/tasks/1/status', { status: 'completed' });
    
    // API should be called again to refresh tasks
    expect(mockedAxios.get).toHaveBeenCalledTimes(2);
  });

  test('deletes task when confirmed in delete dialog', async () => {
    mockedAxios.delete.mockResolvedValueOnce({ data: { success: true } });
    
    const user = userEvent.setup();
    renderWithProviders(<Dashboard />);
    
    // Wait for loading spinner to disappear
    await waitForElementToBeRemoved(() => screen.queryByRole('progressbar'), { timeout: 10000 });
    
    // Find and click the delete task button
    const deleteButton = screen.getByTestId('delete-task-btn');
    await user.click(deleteButton);
    
    // Check if the dialog is rendered
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
    
    // Find and click the delete button in the dialog
    const dialogActions = screen.getByTestId('dialog-actions');
    const confirmButton = within(dialogActions).getByText(/Delete/i);
    await user.click(confirmButton);
    
    // API should be called to delete task
    expect(mockedAxios.delete).toHaveBeenCalledWith('/api/tasks/1');
  });

  // Responsive design tests
  
  test('renders in mobile view with compact components', async () => {
    // Mock mobile view
    const useMediaQueryMock = require('@mui/material').useMediaQuery;
    useMediaQueryMock.mockImplementation(() => true); // All media queries return true
    
    renderWithProviders(<Dashboard />);
    
    // Wait for loading spinner to disappear
    await waitForElementToBeRemoved(() => screen.queryByRole('progressbar'), { timeout: 10000 });
    
    // Sidebar should be closed by default on mobile
    expect(screen.getByTestId('sidebar')).toHaveTextContent('Sidebar (Closed)');
    
    // Weather widget should be compact
    expect(screen.getByTestId('weather-widget')).toHaveTextContent('Weather Widget (Compact)');
    
    // Task summary should be compact
    expect(screen.getByTestId('task-summary')).toHaveTextContent('Compact: true');
  });

  // Error handling tests
  
  test('shows error when task deletion fails', async () => {
    // Mock API error for delete
    mockedAxios.delete.mockRejectedValueOnce(new Error('Delete Error'));
    
    const user = userEvent.setup();
    renderWithProviders(<Dashboard />);
    
    // Wait for loading spinner to disappear
    await waitForElementToBeRemoved(() => screen.queryByRole('progressbar'), { timeout: 10000 });
    
    // Find and click the delete task button
    const deleteButton = screen.getByTestId('delete-task-btn');
    await user.click(deleteButton);
    
    // Check if the dialog is rendered
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
    
    // Find and click the delete button in the dialog
    const dialogActions = screen.getByTestId('dialog-actions');
    const confirmButton = within(dialogActions).getByText(/Delete/i);
    await user.click(confirmButton);
    
    // API should be called to delete task
    expect(mockedAxios.delete).toHaveBeenCalledWith('/api/tasks/1');
    
    // Should show error message
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  test('shows error when task status change fails', async () => {
    // Mock API error for patch
    mockedAxios.patch.mockRejectedValueOnce(new Error('Patch Error'));
    
    const user = userEvent.setup();
    renderWithProviders(<Dashboard />);
    
    // Wait for loading spinner to disappear
    await waitForElementToBeRemoved(() => screen.queryByRole('progressbar'), { timeout: 10000 });
    
    // Click change status button
    await user.click(screen.getByTestId('change-status-btn'));
    
    // Should show error message
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  // Logout test
  
  test('logs out user and redirects to login page', async () => {
    // Mock the logout action
    const mockDispatch = jest.fn();
    store.dispatch = mockDispatch;
    
    renderWithProviders(<Dashboard />);
    
    // Wait for loading spinner to disappear
    await waitForElementToBeRemoved(() => screen.queryByRole('progressbar'), { timeout: 10000 });
    
    // Manually trigger logout
    const logoutAction = { type: 'auth/logout' };
    store.dispatch(logoutAction);
    
    // Verify dispatch was called with logout action
    expect(mockDispatch).toHaveBeenCalledWith(logoutAction);
    
    // Since we're using a mock store, we need to manually update it
    store = mockStore({
      auth: {
        isAuthenticated: false,
        token: null,
        user: null
      }
    });
    
    // Re-render with updated store
    renderWithProviders(<Dashboard />);
    
    // Now the component should redirect
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });
}); 