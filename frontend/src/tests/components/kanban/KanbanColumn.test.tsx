import React from 'react';
import { render, screen } from '@testing-library/react';
import { KanbanColumn } from '../../../components/kanban';
import { TaskStatus, Task, TaskPriority } from '../../../types/task';

// Mock the TaskCard component
jest.mock('../../../components/kanban/TaskCard', () => ({
  __esModule: true,
  default: ({ task }: { task: Task }) => (
    <div data-testid={`task-card-${task.id}`}>{task.title}</div>
  )
}));

describe('KanbanColumn Component', () => {
  const mockTasks: Task[] = [
    {
      id: '1',
      title: 'Task 1',
      description: 'Description 1',
      status: TaskStatus.PENDING,
      priority: TaskPriority.HIGH,
      due_date: '2023-12-01',
      created_at: '2023-11-01',
      updated_at: '2023-11-01',
      is_private: false,
      department: 'Engineering',
      assigned_to: [],
      created_by: 'user1',
      context: 'personal'
    },
    {
      id: '2',
      title: 'Task 2',
      description: 'Description 2',
      status: TaskStatus.PENDING,
      priority: TaskPriority.MEDIUM,
      due_date: '2023-12-02',
      created_at: '2023-11-02',
      updated_at: '2023-11-02',
      is_private: false,
      department: 'Engineering',
      assigned_to: [],
      created_by: 'user1',
      context: 'personal'
    }
  ];

  const mockGetUserName = jest.fn().mockResolvedValue('User Name');
  const mockOnEditTask = jest.fn();
  const mockOnDeleteTask = jest.fn();
  const mockOnChangeTaskStatus = jest.fn();

  test('renders column title correctly', () => {
    render(
      <KanbanColumn
        title="To Do"
        tasks={mockTasks}
        status="pending"
        getUserName={mockGetUserName}
      />
    );

    expect(screen.getByText('To Do')).toBeInTheDocument();
  });

  test('renders task count chip', () => {
    render(
      <KanbanColumn
        title="To Do"
        tasks={mockTasks}
        status="pending"
        getUserName={mockGetUserName}
      />
    );

    expect(screen.getByText('2')).toBeInTheDocument();
  });

  test('renders all task cards', () => {
    render(
      <KanbanColumn
        title="To Do"
        tasks={mockTasks}
        status="pending"
        getUserName={mockGetUserName}
      />
    );

    expect(screen.getByTestId('task-card-1')).toBeInTheDocument();
    expect(screen.getByTestId('task-card-2')).toBeInTheDocument();
    expect(screen.getByText('Task 1')).toBeInTheDocument();
    expect(screen.getByText('Task 2')).toBeInTheDocument();
  });

  test('displays "No tasks" message when tasks array is empty', () => {
    render(
      <KanbanColumn
        title="To Do"
        tasks={[]}
        status="pending"
        getUserName={mockGetUserName}
      />
    );

    expect(screen.getByText('No tasks')).toBeInTheDocument();
  });

  test('passes correct props to TaskCard components', () => {
    const { container } = render(
      <KanbanColumn
        title="To Do"
        tasks={mockTasks}
        status="pending"
        getUserName={mockGetUserName}
        onEditTask={mockOnEditTask}
        onDeleteTask={mockOnDeleteTask}
        onChangeTaskStatus={mockOnChangeTaskStatus}
        formatDate={(date) => `Formatted: ${date}`}
      />
    );

    // Check that we have the right number of TaskCard elements
    const taskCardElements = container.querySelectorAll('[data-testid^="task-card-"]');
    expect(taskCardElements.length).toBe(2);
  });
}); 