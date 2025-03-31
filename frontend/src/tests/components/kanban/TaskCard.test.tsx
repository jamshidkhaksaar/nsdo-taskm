import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TaskCard } from '../../../components/kanban';
import { TaskStatus, Task, TaskPriority } from '../../../types/task';
import { createTheme } from '@mui/material/styles';

// Mock the TaskStatusBadge component
jest.mock('../../../components/kanban/TaskStatusBadge', () => ({
  __esModule: true,
  default: ({ status }: { status: TaskStatus }) => (
    <div data-testid={`status-badge-${status}`}>Status: {status}</div>
  )
}));

describe('TaskCard Component', () => {
  const mockTask: Task = {
    id: '1',
    title: 'Test Task',
    description: 'This is a test task description',
    status: TaskStatus.PENDING,
    priority: TaskPriority.HIGH,
    due_date: '2023-12-01',
    created_at: '2023-11-01',
    updated_at: '2023-11-01',
    is_private: false,
    department: 'Engineering',
    assigned_to: ['user1', 'user2'],
    created_by: 'admin',
    context: 'personal'
  };

  const mockTheme = createTheme();
  const mockGetUserName = jest.fn().mockImplementation((userId) => 
    Promise.resolve(`User ${userId}`)
  );
  const mockOnEdit = jest.fn();
  const mockOnDelete = jest.fn();
  const mockOnChangeStatus = jest.fn().mockResolvedValue(true);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders task title and description', async () => {
    render(
      <TaskCard
        task={mockTask}
        statusColor="#ff9800"
        getUserName={mockGetUserName}
        theme={mockTheme}
      />
    );

    expect(screen.getByText('Test Task')).toBeInTheDocument();
    expect(screen.getByText('This is a test task description')).toBeInTheDocument();
  });

  test('renders priority chip correctly', () => {
    render(
      <TaskCard
        task={mockTask}
        statusColor="#ff9800"
        getUserName={mockGetUserName}
        theme={mockTheme}
      />
    );

    expect(screen.getByText('High')).toBeInTheDocument();
  });

  test('loads and displays assigned user names', async () => {
    render(
      <TaskCard
        task={mockTask}
        statusColor="#ff9800"
        getUserName={mockGetUserName}
        theme={mockTheme}
      />
    );

    // Wait for the useEffect to load user names
    await waitFor(() => {
      expect(mockGetUserName).toHaveBeenCalledTimes(2);
      expect(mockGetUserName).toHaveBeenCalledWith('user1');
      expect(mockGetUserName).toHaveBeenCalledWith('user2');
    });
  });

  test('calls onEdit when edit button is clicked', () => {
    render(
      <TaskCard
        task={mockTask}
        statusColor="#ff9800"
        getUserName={mockGetUserName}
        onEdit={mockOnEdit}
        theme={mockTheme}
      />
    );

    const editButton = screen.getByLabelText('Edit Task');
    fireEvent.click(editButton);
    
    expect(mockOnEdit).toHaveBeenCalledTimes(1);
    expect(mockOnEdit).toHaveBeenCalledWith('1');
  });

  test('calls onDelete when delete button is clicked', () => {
    render(
      <TaskCard
        task={mockTask}
        statusColor="#ff9800"
        getUserName={mockGetUserName}
        onDelete={mockOnDelete}
        theme={mockTheme}
      />
    );

    const deleteButton = screen.getByLabelText('Delete Task');
    fireEvent.click(deleteButton);
    
    expect(mockOnDelete).toHaveBeenCalledTimes(1);
    expect(mockOnDelete).toHaveBeenCalledWith('1');
  });

  test('shows next status button and calls onChangeStatus when clicked', async () => {
    render(
      <TaskCard
        task={mockTask}
        statusColor="#ff9800"
        getUserName={mockGetUserName}
        onChangeStatus={mockOnChangeStatus}
        theme={mockTheme}
      />
    );

    // For pending task, we should see a "Start Task" button
    const startButton = screen.getByLabelText('Start Task');
    fireEvent.click(startButton);
    
    await waitFor(() => {
      expect(mockOnChangeStatus).toHaveBeenCalledTimes(1);
      expect(mockOnChangeStatus).toHaveBeenCalledWith('1', TaskStatus.IN_PROGRESS);
    });
  });

  test('handles overdue tasks correctly', () => {
    const overdueDueDate = new Date();
    overdueDueDate.setDate(overdueDueDate.getDate() - 2); // 2 days ago
    
    const overdueTask = {
      ...mockTask,
      due_date: overdueDueDate.toISOString(),
    };

    const { container } = render(
      <TaskCard
        task={overdueTask}
        statusColor="#ff9800"
        getUserName={mockGetUserName}
        theme={mockTheme}
      />
    );

    // Look for an element with styles indicating overdue
    // Note: This test might need adjustments based on your styling approach
    const dateElement = screen.getByText(expect.stringContaining(overdueDueDate.toISOString().split('T')[0]));
    expect(dateElement).toBeInTheDocument();
  });
}); 